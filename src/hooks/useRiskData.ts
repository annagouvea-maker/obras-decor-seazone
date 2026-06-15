/**
 * useRiskData — Radar de Risco das Obras Decor
 * Lê a planilha BD Obras com parsing de nível de tarefa e
 * calcula score de risco 0–100 via algoritmo determinístico.
 */
import { useState, useEffect, useCallback } from "react";

const FILE_ID = "1RC6xjHfDDlTtWGMemCRzdVVSdzjHkweSzz14-6qvRwE";
const GID = "633870424";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface RiskTask {
  nome: string;
  adm: string;
  ip: string;   // Início Planejado
  tp: string;   // Término Planejado
  ir: string;   // Início Real
  tr: string;   // Término Real
  status: string;
  pct: number;
}

export interface RiskFactor {
  label: string;
  color: "red" | "amber" | "green";
}

export interface RiskScore {
  score: number;
  level: "crit" | "warn" | "safe";
  label: string;
  factors: RiskFactor[];
}

export interface RiskUnit {
  id: string;
  emp: string;
  unid: string;
  inv: string;
  pkg: string;
  statusObra: string;
  prazo: number;
  pct: number;
  tasks: RiskTask[];
  risk: RiskScore;
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function parseDate(s: string): Date | null {
  if (!s || s === "-") return null;
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
}

function daysDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// ─── Risk Scoring ─────────────────────────────────────────────────────────────
function calcRisk(u: Omit<RiskUnit, "risk">): RiskScore {
  const TODAY = new Date();
  let s = 0;
  const factors: RiskFactor[] = [];

  const st = u.statusObra;
  // Unidades finalizadas não têm mais risco ativo
if (st.includes("FINALIZADA")) {
  return {
    score: 0,
    level: "safe",
    label: "Baixo",
    factors: [{ label: "Obra Finalizada", color: "green" }],
  };
}
  if (st.includes("ATRASADA"))       { s += 40; factors.push({ label: "Obra Atrasada", color: "red" }); }
  else if (st.includes("ATENÇÃO"))   { s += 15; factors.push({ label: "Atenção: Prazo Final", color: "amber" }); }
  else if (st.includes("AGUARDANDO")){ s += 5;  factors.push({ label: "Aguardando Início", color: "amber" }); }
  else if (st.includes("ATRASO"))    { s += 25; factors.push({ label: "Finalizada com Atraso", color: "amber" }); }

  const vi = u.tasks.find((t) => t.nome === "Vistoria Implantação");
  if (vi && vi.status !== "Finalizado") {
    const dl = parseDate(vi.tp) ?? parseDate(vi.ip);
    if (dl) {
      const diff = daysDiff(TODAY, dl);
      if (diff <= 0)       { s += 25; factors.push({ label: `Vistoria ${Math.abs(diff)}d atrasada`, color: "red" }); }
      else if (diff <= 3)  { s += 22; factors.push({ label: `Vistoria em ${diff}d`, color: "red" }); }
      else if (diff <= 7)  { s += 14; factors.push({ label: `Vistoria em ${diff}d`, color: "amber" }); }
      else if (diff <= 14) { s += 6;  factors.push({ label: `Vistoria em ${diff}d`, color: "amber" }); }
    }
  }

  const p = u.pct;
  if (p < 50)      { s += 20; factors.push({ label: `${p}% concluído`, color: "red" }); }
  else if (p < 70) { s += 12; factors.push({ label: `${p}% concluído`, color: "amber" }); }
  else if (p < 85) { s += 6; }
  else if (p < 95) { s += 2; }

 const overdue = u.tasks.filter(
  (t) =>
    ["Em Andamento", "Pendente", "Não iniciado"].includes(t.status) &&
      !t.tr &&
      parseDate(t.tp) !== null &&
      parseDate(t.tp)! < TODAY,
  );
  if (overdue.length) {
    s += Math.min(15, overdue.length * 6);
    factors.push({ label: `${overdue.length} tarefa(s) em atraso`, color: "red" });
  }

  const done = u.tasks.filter(
    (t) => t.status === "Finalizado" && t.ir && t.ir !== "-" && t.ip,
  );
  if (done.length) {
    let tot = 0, cnt = 0;
    done.forEach((t) => {
      const ip = parseDate(t.ip);
      const ir = parseDate(t.ir);
      if (ip && ir) { tot += Math.max(0, daysDiff(ip, ir)); cnt++; }
    });
    if (cnt) {
      const avg = Math.round(tot / cnt);
      if (avg > 20)      { s += 10; factors.push({ label: `Desvio médio: ${avg}d`, color: "amber" }); }
      else if (avg > 10) { s += 6;  factors.push({ label: `Desvio médio: ${avg}d`, color: "amber" }); }
      else if (avg > 5)  { s += 3; }
    }
  }

  s = Math.min(100, s);
  const level = s >= 60 ? "crit" : s >= 30 ? "warn" : "safe";
  return {
    score: s,
    level,
    label: level === "crit" ? "Crítico" : level === "warn" ? "Atenção" : "Em Dia",
    factors,
  };
}

// ─── Bottleneck detection ─────────────────────────────────────────────────────
export function detectBottlenecks(
  units: RiskUnit[],
): { nome: string; count: number }[] {
  const map: Record<string, number> = {};
  units.forEach((u) =>
    u.tasks.forEach((t) => {
      if (["Em Andamento", "Pendente"].includes(t.status) && !t.tr)
        map[t.nome] = (map[t.nome] ?? 0) + 1;
    }),
  );
  return Object.entries(map)
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([nome, count]) => ({ nome, count }));
}

// ─── Sheet fetch + parse ──────────────────────────────────────────────────────
async function fetchRows(): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${FILE_ID}/gviz/tq?tqx=out:json&gid=${GID}`;
  const res = await fetch(url);
  const text = await res.text();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Formato inesperado da API Google Sheets");
  const json = JSON.parse(text.slice(start, end + 1));
  const cols: string[] = (json?.table?.cols ?? []).map((c: { label?: string }) =>
    (c.label || "").trim(),
  );
  const tableRows: { c?: ({ v?: unknown; f?: string } | null)[] }[] =
    json?.table?.rows ?? [];
  const dataRows = tableRows.map((row) =>
    (row?.c ?? []).map((cell) => {
      if (!cell || cell.v === null || cell.v === undefined) return "";
      if (typeof cell.f === "string" && cell.f.trim()) return cell.f.trim();
      return String(cell.v).trim();
    }),
  );
  return cols.length > 0 ? [cols, ...dataRows] : dataRows;
}

function parseRiskUnits(rows: string[][]): Omit<RiskUnit, "risk">[] {
  const units: Omit<RiskUnit, "risk">[] = [];
  let cur: Omit<RiskUnit, "risk"> | null = null;
  for (const r of rows) {
    while (r.length < 25) r.push("");
    if (r[0]?.includes(":-:") || r[0] === "ID Card Pipefy") continue;
    if (r[12] === "Tarefa") continue;
    const c0 = r[0] ?? "";
    const c12 = r[12] ?? "";
    if (/^\d{8,}$/.test(c0) && c12 !== "Total") {
      cur = {
        id: c0,
        emp: r[1] ?? "",
        unid: r[2] ?? "",
        inv: r[3] ?? "",
        pkg: r[6] ?? "",
        statusObra: r[21] ?? "",
        prazo: parseInt(r[20] ?? "60") || 60,
        pct: 0,
        tasks: [],
      };
      units.push(cur);
    } else if (/^\d{8,}$/.test(c0) && c12 === "Total") {
      if (cur) cur.pct = parseInt((r[19] ?? "0").replace("%", "")) || 0;
    } else if (!c0 && c12 && c12 !== "Total") {
      cur?.tasks.push({
        nome: c12,
        adm: r[13] ?? "",
        ip: r[14] ?? "",
        tp: r[15] ?? "",
        ir: r[16] ?? "",
        tr: r[17] ?? "",
        status: r[18] ?? "",
        pct: parseInt((r[19] ?? "0").replace("%", "")) || 0,
      });
    }
  }
  return units.filter((u) => u.emp && u.unid);
}

// ─── Cache helpers ────────────────────────────────────────────────────────────
const CACHE_KEY = "sz_risk_v1";
const CACHE_TTL = 5 * 60 * 1000;

function getCache(): RiskUnit[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: RiskUnit[]; ts: number };
    return Date.now() - ts > CACHE_TTL ? null : data;
  } catch {
    return null;
  }
}

function setCache(data: RiskUnit[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage indisponível (SSR ou cheio) — ignora
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export interface RiskDataState {
  units: RiskUnit[];
  loading: boolean;
  error: string | null;
  lastSynced: Date | null;
  refresh: () => void;
}

export function useRiskData(): RiskDataState {
  const [units, setUnits] = useState<RiskUnit[]>(() => getCache() ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchRows();
      const raw = parseRiskUnits(rows);
      const enriched: RiskUnit[] = raw
        .map((u) => ({ ...u, risk: calcRisk(u) }))
        .sort((a, b) => b.risk.score - a.risk.score);
      setUnits(enriched);
      setCache(enriched);
      setLastSynced(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getCache()) fetchAll();
    else setLastSynced(new Date());
  }, [fetchAll]);

  return { units, loading, error, lastSynced, refresh: fetchAll };
}
