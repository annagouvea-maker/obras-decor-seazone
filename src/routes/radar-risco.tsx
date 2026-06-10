import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  detectBottlenecks,
  useRiskData,
  type RiskUnit,
} from "@/hooks/useRiskData";

export const Route = createFileRoute("/radar-risco")({
  head: () => ({
    meta: [
      { title: "Radar de Risco — Seazone Decor" },
      {
        name: "description",
        content: "Score de risco por unidade e detecção de gargalos.",
      },
    ],
  }),
  component: RadarRiscoPage,
});

// ─── UI helpers ───────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="text-3xl font-semibold tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function RiskBadge({
  level,
  label,
}: {
  level: "crit" | "warn" | "safe";
  label: string;
}) {
  const cls = {
    crit: "bg-red-50 text-red-600 border-red-200",
    warn: "bg-amber-50 text-amber-600 border-amber-200",
    safe: "bg-green-50 text-green-600 border-green-200",
  }[level];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function UnitCard({ unit }: { unit: RiskUnit }) {
  const { risk } = unit;
  const borderColor =
    risk.level === "crit"
      ? "#ef4444"
      : risk.level === "warn"
        ? "#f59e0b"
        : "#22c55e";
  const pctColor =
    unit.pct >= 85 ? "#22c55e" : unit.pct >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 border-l-4"
      style={{ borderLeftColor: borderColor }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-[#171E37] truncate">
            {unit.emp} — Unidade {unit.unid}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            {unit.inv || "Investidor não informado"} · {unit.pkg}
          </div>
        </div>
        <RiskBadge level={risk.level} label={risk.label} />
      </div>

      <div className="flex flex-col gap-3">
        {/* Barra de conclusão */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Conclusão</span>
            <span className="font-medium tabular-nums" style={{ color: pctColor }}>
              {unit.pct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${unit.pct}%`, backgroundColor: pctColor }}
            />
          </div>
        </div>

        {/* Score de risco */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Score de risco</p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${risk.score}%`, backgroundColor: borderColor }}
              />
            </div>
            <span className="text-sm font-semibold tabular-nums w-8 text-right" style={{ color: borderColor }}>
              {risk.score}
            </span>
          </div>
        </div>

        {/* Fatores de risco */}
        {risk.factors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {risk.factors.map((f, i) => (
              <span
                key={i}
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${
                  f.color === "red"
                    ? "bg-red-50 text-red-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {f.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function RadarRiscoPage() {
  const { units, loading, error, lastSynced, refresh } = useRiskData();
  const [activeFilter, setActiveFilter] = useState("Todos");

  const emps = useMemo(
    () => ["Todos", ...Array.from(new Set(units.map((u) => u.emp)))],
    [units],
  );

  const filtered = useMemo(
    () =>
      activeFilter === "Todos"
        ? units
        : units.filter((u) => u.emp === activeFilter),
    [units, activeFilter],
  );

  const kpis = useMemo(
    () => ({
      crit: filtered.filter((u) => u.risk.level === "crit").length,
      warn: filtered.filter((u) => u.risk.level === "warn").length,
      safe: filtered.filter((u) => u.risk.level === "safe").length,
    }),
    [filtered],
  );

  const bottlenecks = useMemo(() => detectBottlenecks(filtered), [filtered]);

  const subtitle = lastSynced
    ? `Atualizado às ${lastSynced.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    : "Carregando…";

  return (
    <AppShell title="Radar de Risco" subtitle={subtitle}>
      {/* Botão atualizar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-sm font-medium text-[#171E37] hover:border-[#171E37] disabled:opacity-50 transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* Erro */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total" value={filtered.length} color="#171E37" icon={Zap} />
        <KpiCard label="Crítico" value={kpis.crit} color="#ef4444" icon={AlertCircle} />
        <KpiCard label="Atenção" value={kpis.warn} color="#f59e0b" icon={AlertTriangle} />
        <KpiCard label="Em Dia" value={kpis.safe} color="#22c55e" icon={ShieldCheck} />
      </div>

      {/* Alerta de gargalo */}
      {bottlenecks.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Gargalo sistêmico:</span>{" "}
            {bottlenecks.map((b, i) => (
              <span key={b.nome}>
                {i > 0 && " · "}
                “{b.nome}” em aberto em{" "}
                <span className="font-semibold">{b.count} unidades</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filtros por empreendimento */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {emps.map((e) => (
          <button
            key={e}
            onClick={() => setActiveFilter(e)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              activeFilter === e
                ? "bg-[#171E37] text-white border-[#171E37]"
                : "bg-white text-gray-500 border-gray-200 hover:border-[#171E37] hover:text-[#171E37]"
            }`}
          >
            {e}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500">
          {filtered.length} unidades · por risco ↓
        </span>
      </div>

      {/* Skeleton de loading */}
      {loading && units.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-white border border-gray-200 animate-pulse" />
          ))}
        </div>
      )}

      {/* Grid de cards */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-500">
          Nenhuma unidade encontrada.
        </div>
      )}

      {/* Rodapé */}
      {units.length > 0 && (
        <div className="mt-8 text-center text-xs text-gray-400">
          {units.length} unidades · {emps.length - 1} empreendimentos (
          {emps.slice(1).join(", ")}) · BD Obras Decor
        </div>
      )}
    </AppShell>
  );
}