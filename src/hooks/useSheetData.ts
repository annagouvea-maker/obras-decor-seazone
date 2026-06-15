/**
 * useSheetData — sincronização automática com Google Sheets
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

const COMPRAS_SHEET_ID = "137ABq7Zxpf0QZmPBY0IlfkGRnvow8rfr4KbFsQbhrqg";
const COMPRAS_GID = "271446938";

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_KEY_OBRAS = "sz_obras_v1";
const CACHE_KEY_COMPRAS = "sz_compras_v1";

interface CacheEntry<T> {
  data: T;
  ts: number;
}

function gvizUrl(sheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
}

async function fetchRows(sheetId: string, gid: string): Promise<string[][]> {
  const res = await fetch(gvizUrl(sheetId, gid));
  const text = await res.text();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Formato inesperado da API Google Sheets");
  const json = JSON.parse(text.slice(start, end + 1));
  const cols: string[] = (json?.table?.cols ?? []).map((c: any) => (c.label || "").trim());
  const tableRows: any[] = json?.table?.rows ?? [];
  const dataRows = tableRows.map((row: any) => {
    const cells: (any | null)[] = row?.c ?? [];
    return cells.map((cell: any) => {
      if (!cell || cell.v === null || cell.v === undefined) return "";
      if (typeof cell.f === "string" && cell.f.trim()) return cell.f.trim();
      return String(cell.v).trim();
    });
  });
  return cols.length > 0 ? [cols, ...dataRows] : dataRows;
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
  } catch {}
}

// ─── Parser de Obras ─────────────────────────────────────────────────────────
function parseStatusObra(raw: string): StatusObra {
  const up = raw.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (up.includes("CONCLU") || up.includes("FINALIZ") || up.includes("ENTREGUE")) return "Concluída";
  if (up.includes("ATRASAD") || raw.includes("🔴")) return "Atrasada";
  if (up.includes("ATENCAO") || up.includes("ATENÇAO") || raw.includes("⚠️")) return "Atenção Prazo";
  if (up.includes("EM DIA") || raw.includes("✅")) return "Em Dia";
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
    while (row.length < 35) row.push("");
    const id = row[0];
    const tarefa = row[12];
    if (id === "ID Card Pipefy") continue;
    if (!id && !tarefa) continue;
    if (id && id !== currentId && /^\d+$/.test(id.replace(/[,. ]/g, ""))) {
      currentId = id;
      const driveLink = (row[24] || "").trim();
      const driveUrl = driveLink.startsWith("https://") ? driveLink : undefined;
      currentUnit = {
        unidade: row[2],
        empreendimento: row[1],
        investidor: row[3],
        pacote: normalizePacote(row[6]),
        adm: row[13] || "MOG",
        status: parseStatusObra(row[21]),
        prazo: `${row[20] || "60"} dias`,
        percentual: 0,
        driveUrl,
      };
    }
    if (tarefa === "Total" && currentUnit) {
      const pctStr = row[19] || "0%";
      const pct = parseInt(pctStr.replace("%", "").replace(",", ".")) || 0;
      currentUnit.percentual = pct;
      if (currentUnit.unidade && currentUnit.empreendimento) {
        units.push(currentUnit as Unidade);
      }
      currentUnit = null;
    }
  }
  return units;
}

// ─── Parser de Compras ───────────────────────────────────────────────────────
function parseStatusEntrega(raw: string): StatusEntrega {
  const low = raw.toLowerCase();
  if (low.includes("entregue") || low.includes("entregues") || low.includes("finalizado")) return "Entregue";
  if (low.includes("atrasad")) return "Atrasado";
  if (low.includes("cancelad")) return "Cancelado";
  if (low.includes("devolu")) return "Devolvido";
  if (low.includes("pendente")) return "Pendente";
  if (!raw || raw === "-") return "Pendente";
  return "Previsto";
}

function parseBRL(str: string): number {
  if (!str) return 0;
  const clean = str
    .replace(/R\$\s*/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  return parseFloat(clean) || 0;
}

function parseComprasRows(rows: string[][]): Compra[] {
  const compras: Compra[] = [];
  let headerIdx = -1;
  let produtoIdx = 3; // padrão: Coluna D (A=Empreendimento, B=TítuloSienge, C=Categoria, D=Produto)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const pIdx = row.findIndex((cell, j) => j <= 6 && cell.trim() === "Produto");
    if (pIdx >= 0) {
      headerIdx = i;
      produtoIdx = pIdx;
      break;
    }
    if (row[0] === "Empreendimento") {
      headerIdx = i;
      break;
    }
  }

  const headerRow = headerIdx >= 0 ? rows[headerIdx] : [];
  const catIdx = headerRow.findIndex((c) => c.trim().toLowerCase().includes("categor"));
  const statusIdx = headerRow.findIndex((c) => c.trim().toLowerCase().includes("status"));

  const qtdeIdx  = produtoIdx + 5; // Quantidade
  const valorIdx = produtoIdx + 7; // Valor Total

  const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows;
  let counter = 1;

  for (const row of dataRows) {
    while (row.length < 30) row.push("");

    const empreendimento = (row[0] || "").trim();
    const produto = (row[produtoIdx] || "").trim();

    if (!empreendimento || !produto) continue;
    if (produto === "Produto") continue;
    if (empreendimento === "Empreendimento") continue;

    const valorTotal = parseBRL(row[valorIdx]);
    const qtde = parseFloat((row[qtdeIdx] || "1").replace(",", ".")) || 1;
    const rawStatus = statusIdx >= 0 ? (row[statusIdx] || "").trim() : "";

    compras.push({
      codigo: row[1] || `C${String(counter).padStart(3, "0")}`,
      categoria: catIdx >= 0 ? (row[catIdx] || "").trim() : "",
      produto,
      especificacoes: (row[produtoIdx + 1] || "").trim(),
      unidades: (row[produtoIdx + 2] || "").trim(),
      qtde,
      valorTotal,
      prazoEntrega: "",
      status: parseStatusEntrega(rawStatus),
      fornecedor: "",
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

      // ── Compras (aba única com todos os empreendimentos) ──
      const comprasRows = await fetchRows(COMPRAS_SHEET_ID, COMPRAS_GID);
      const allCompras = parseComprasRows(comprasRows);
      if (allCompras.length > 0) {
        setCompras(allCompras);
        setCache(CACHE_KEY_COMPRAS, allCompras);
      }

      setLastSynced(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao sincronizar planilhas";
      setError(msg);
      console.error("[useSheetData]", msg);
    } finally {
      setLoading(false);
    }
  }, []);

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
