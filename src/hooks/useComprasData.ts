import { useState, useEffect, useCallback } from "react";

export interface Compra {
  empreendimento: string;
  categoria: string;
  produto: string;
  unidades: string;
  valorTotal: number;
  dataPedido: string;
  statusEntrega: string;
}

export interface ComprasData {
  compras: Compra[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

const SHEET_ID = "137ABq7Zxpf0QZmPBY0IlfkGRnvow8rfr4KbFsQbhrqg";
const GID = "271446938";
const CACHE_KEY = "compras_cache";
const CACHE_TTL = 5 * 60 * 1000;

function parseValue(cell: any): string {
  if (!cell) return "";
  return cell.f ?? (cell.v !== null && cell.v !== undefined ? String(cell.v) : "");
}

function parseNumber(cell: any): number {
  if (!cell) return 0;
  if (typeof cell.v === "number") return cell.v;
  const raw = String(cell.f ?? cell.v ?? "0")
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return parseFloat(raw) || 0;
}

function loadCache(): { data: Compra[]; ts: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCache(data: Compra[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export function useComprasData(): ComprasData {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {}
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cached = loadCache();
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setCompras(cached.data);
      setLastUpdated(new Date(cached.ts));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const query = encodeURIComponent("SELECT A, C, D, F, K, P, Y");
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}&tq=${query}`;

    fetch(url)
      .then((r) => r.text())
      .then((text) => {
        if (cancelled) return;
        const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
        const rows: Compra[] = (json.table?.rows ?? [])
          .map((row: any) => {
            const c = row.c ?? [];
            return {
              empreendimento: parseValue(c[0]),
              categoria: parseValue(c[1]),
              produto: parseValue(c[2]),
              unidades: parseValue(c[3]),
              valorTotal: parseNumber(c[4]),
              dataPedido: parseValue(c[5]),
              statusEntrega: parseValue(c[6]),
            };
          })
          .filter((r: Compra) => r.empreendimento !== "");
        saveCache(rows);
        setCompras(rows);
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(String(e));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { compras, loading, error, lastUpdated, refresh };
}