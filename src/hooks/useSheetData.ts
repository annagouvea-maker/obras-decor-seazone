/**
 * useSheetData — sincronização automática com Google Sheets
 *
 * Busca os dados das planilhas de Obras e Compras via API pública do Google
 * (gviz/tq) sem necessidade de autenticação ou CORS proxy.
 *
 * A cada visita à página, os dados são buscados frescos do Google Sheets.
 * Um cache de 5 minutos no localStorage evita requisições desnecessárias.
 */

import { useState, useEffect, useCallback } from "react";
import {
  UNIDADES,
  COMPRAS,
  type Unidade,
  type Compra,
  type StatusObra,
  type StatusEntrega,
} from "@/data/seazone";

// ─── IDs das planilhas ────────────────────────────────────────────────────────
const OBRAS_SHEET_ID = "1RC6xjHfDDlTtWGMemCRzdVVSdzjHkweSzz14-6qvRwE";
const OBRAS_GID = "633870424";

const COMPRAS_SHEET_ID = "1nCmDK4k39qk449pZpP9FCYolzW7U17jv6IBtRxPaq3Q";

// Abas da planilha de Compras — cada aba é um empreendimento
// Para adicionar novos empreendimentos: copie o link da aba no Sheets,
// pegue o gid= no final da URL e adicione aqui.
const COMPRAS_TABS: { gid: string; empreendimento: string }[] = [
  { gid: "271446938", empreendimento: "Urubici Spot" },
  // Adicione as outras abas abaixo quando os GIDs forem identificados:
  // { gid: "XXXXXXXXX", empreendimento: "Penha Spot" },
  // { gid: "XXXXXXXXX", empreendimento: "MOV Perdizes" },
];

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const CACHE_KEY_OBRAS = "sz_obras_v1";
const CACHE_KEY_COMPRAS = "sz_compras_v1";

// ─── Tipos internos ───────────────────────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  ts: number; // timestamp de quando foi buscado
}

// ─── Utilitários ─────────────────────────────────────────────────────────────
function gvizUrl(sheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
}

async function fetchRows(sheetId: string, gid: string): Promise<string[][]> {
  const res = await fetch(gvizUrl(sheetId, gid));
  const text = await res.text();

  // A resposta vem com um wrapper JSONP: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  // Precisamos extrair só o JSON interno.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Formato inesperado da API Google Sheets");

  const json = JSON.parse(text.slice(start, end + 1));
  const tableRows: any[] = json?.table?.rows ?? [];

  return tableRows.map((row: any) => {
    const cells: (any | null)[] = row?.c ?? [];
    return cells.map((cell: any) => {
      if (!cell || cell.v === null || cell.v === undefined) return "";
      // Preferir o valor formatado (cell.f) quando disponível — mantém "75%", datas, etc.
      if (typeof cell.f === "string" && cell.f.trim()) return cell.f.trim();
      return String(cell.v).trim();
    });
  });
}

function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, ts: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage cheio — ignora silenciosamente
  }
}

// ─── Parser de Obras ─────────────────────────────────────────────────────────
function parseStatusObra(raw: string): StatusObra {
  if (raw.includes("ATRASADA") || raw.includes("🔴")) return "Atrasada";
  if (raw.includes("ATENÇÃO") || raw.includes("⚠️")) return "Atenção Prazo";
  if (raw.includes("EM DIA") || raw.includes("✅")) return "Em Dia";
  if (raw.includes("CONCLUÍDA") || raw.includes("CONCLUIDA")) return "Concluída";
  return "Em Dia";
}

function normalizePacote(raw: string): Unidade["pacote"] {
  if (raw === "Premium") return "Premium";
  if (raw === "Plus") return "Plus";
  return "Essential";
}

function parseObrasRows(rows: string[][]): Unidade[] {
  const units: Unidade[] = [];
  let currentUnit: Partial<Unidade> | null = null;
  let currentId = "";

  for (const row of rows) {
    // Garantir que o array tem colunas suficientes
    while (row.length < 35) row.push("");

    const id = row[0];
    const tarefa = row[12];

    // Pular linha de cabeçalho
    if (id === "ID Card Pipefy") continue;
    // Pular linhas completamente vazias
    if (!id && !tarefa) continue;

    // Início de nova unidade: col 0 tem um ID numérico diferente
    if (id && id !== currentId && /^\d+$/.test(id.replace(/[,. ]/g, ""))) {
      currentId = id;
      currentUnit = {
        unidade: row[2],
        empreendimento: row[1],
        investidor: row[3],
        pacote: normalizePacote(row[6]),
        adm: row[13] || "MOG",
        status: parseStatusObra(row[21]),
        prazo: `${row[20] || "60"} dias`,
        percentual: 0,
      };
    }

    // Linha de totais: captura o percentual geral da unidade
    if (tarefa === "Total" && currentUnit) {
      const pctStr = row[19] || "0%";
      const pct = parseInt(pctStr.replace("%", "").replace(",", ".")) || 0;
      currentUnit.percentual = pct;

      // Só adiciona se tiver os dados mínimos
      if (currentUnit.unidade && currentUnit.empreendimento) {
        units.push(currentUnit as Unidade);
      }
      currentUnit = null;
    }
  }

  return units;
}

// ─── Parser de Compras ───────────────────────────────────────────────────────
function parseStatusEntrega(prazo: string): StatusEntrega {
  const low = prazo.toLowerCase();
  if (low.includes("entregue") || low.includes("entregues")) return "Entregue";
  if (low.includes("atrasad")) return "Atrasado";
  if (low.includes("pendente")) return "Pendente";
  if (!prazo || prazo === "-") return "Pendente";
  return "Previsto";
}

function parseBRL(str: string): number {
  if (!str) return 0;
  // Remove R$, pontos de milhar, espaços e troca vírgula por ponto
  const clean = str
    .replace(/R\$\s*/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  return parseFloat(clean) || 0;
}

function parseComprasRows(rows: string[][], empreendimento: string): Compra[] {
  const compras: Compra[] = [];
  let headerIdx = -1;

  // Encontrar a linha de cabeçalho (contém "Produto" ou "Título Sienge")
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][1] === "Produto" || rows[i][0] === "Título Sienge") {
      headerIdx = i;
      break;
    }
  }

  const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows;
  let counter = 1;

  for (const row of dataRows) {
    // Pular linhas sem produto
    const produto = (row[1] || "").trim();
    if (!produto) continue;
    // Pular se parece ser outra linha de cabeçalho ou empreendimento
    if (produto === "Produto" || produto.includes("Empreendimento:")) continue;

    const valorTotal = parseBRL(row[8]);
    const qtde = parseFloat((row[6] || "1").replace(",", ".")) || 1;
    const prazo = (row[20] || "").trim();

    compras.push({
      codigo: row[0] || `C${String(counter).padStart(3, "0")}`,
      produto,
      especificacoes: (row[2] || "").trim(),
      unidades: (row[3] || "").trim(),
      qtde,
      valorTotal,
      prazoEntrega: prazo,
      status: parseStatusEntrega(prazo),
      fornecedor: (row[25] || "").trim(), // coluna Dados do Fornecedor
      empreendimento,
    });
    counter++;
  }

  return compras;
}

// ─── Hook principal ───────────────────────────────────────────────────────────
export interface SheetDataState {
  unidades: Unidade[];
  compras: Compra[];
  loading: boolean;
  error: string | null;
  lastSynced: Date | null;
  refresh: () => void;
}

export function useSheetData(): SheetDataState {
  const [unidades, setUnidades] = useState<Unidade[]>(() => getCache<Unidade[]>(CACHE_KEY_OBRAS) ?? UNIDADES);
  const [compras, setCompras] = useState<Compra[]>(() => getCache<Compra[]>(CACHE_KEY_COMPRAS) ?? COMPRAS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // ── Obras ──
      const obrasRows = await fetchRows(OBRAS_SHEET_ID, OBRAS_GID);
      const parsed = parseObrasRows(obrasRows);
      if (parsed.length > 0) {
        setUnidades(parsed);
        setCache(CACHE_KEY_OBRAS, parsed);
      }

      // ── Compras (todas as abas) ──
      const allCompras: Compra[] = [];
      for (const tab of COMPRAS_TABS) {
        const rows = await fetchRows(COMPRAS_SHEET_ID, tab.gid);
        const tabCompras = parseComprasRows(rows, tab.empreendimento);
        allCompras.push(...tabCompras);
      }
      if (allCompras.length > 0) {
        setCompras(allCompras);
        setCache(CACHE_KEY_COMPRAS, allCompras);
      }

      setLastSynced(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao sincronizar planilhas";
      setError(msg);
      // Em caso de erro, mantém os dados do cache / estáticos — não quebra a UI
      console.error("[useSheetData]", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca ao montar o componente (se cache expirou)
  useEffect(() => {
    const cachedObras = getCache<Unidade[]>(CACHE_KEY_OBRAS);
    const cachedCompras = getCache<Compra[]>(CACHE_KEY_COMPRAS);
    const cacheValido = cachedObras && cachedCompras;

    if (!cacheValido) {
      fetchAll();
    } else {
      setLastSynced(new Date());
    }
  }, [fetchAll]);

  return { unidades, compras, loading, error, lastSynced, refresh: fetchAll };
}
