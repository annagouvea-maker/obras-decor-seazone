import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Copy,
  FileText,
  RefreshCw,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  detectBottlenecks,
  useRiskData,
  type RiskUnit,
} from "@/hooks/useRiskData";

// ─── Briefing utils ───────────────────────────────────────────────────────────

function parseDateLocal(s: string): Date | null {
  if (!s || s === "-") return null;
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
}

function daysDiffLocal(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function generateBriefingText(units: RiskUnit[]): string {
  const today = new Date();
  const todayStr = today.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  const in7 = new Date(today.getTime() + 7 * 86_400_000);

  const byEmp = new Map<string, RiskUnit[]>();
  units.forEach((u) => {
    if (!byEmp.has(u.emp)) byEmp.set(u.emp, []);
    byEmp.get(u.emp)!.push(u);
  });

  const sections: string[] = [`📋 Briefing Semanal Obras Decor — ${todayStr}\n`];

  for (const [emp, eu] of byEmp) {
    const crit = eu.filter((u) => u.risk.level === "crit").length;
    const warn = eu.filter((u) => u.risk.level === "warn").length;
    const safe = eu.filter((u) => u.risk.level === "safe").length;

    // Vistorias nos próximos 7 dias
    const vis = eu.filter((u) => {
      const vi = u.tasks.find((t) => t.nome === "Vistoria Implantação");
      if (!vi || vi.status === "Finalizado") return false;
      const d = parseDateLocal(vi.tp || vi.ip);
      return d && d >= today && d <= in7;
    });

    // Unidade de maior risco
    const top = [...eu].sort((a, b) => b.risk.score - a.risk.score)[0];

    // Gargalos
    const gMap: Record<string, { count: number; desvios: number[] }> = {};
    eu.forEach((u) =>
      u.tasks.forEach((t) => {
        if (["Em Andamento", "Pendente"].includes(t.status) && !t.tr) {
          if (!gMap[t.nome]) gMap[t.nome] = { count: 0, desvios: [] };
          gMap[t.nome].count++;
        }
        if (t.status === "Finalizado" && t.ir && t.ip) {
          const ip = parseDateLocal(t.ip);
          const ir = parseDateLocal(t.ir);
          if (ip && ir) {
            if (!gMap[t.nome]) gMap[t.nome] = { count: 0, desvios: [] };
            gMap[t.nome].desvios.push(Math.max(0, daysDiffLocal(ip, ir)));
          }
        }
      }),
    );
    const topG = Object.entries(gMap)
      .filter(([, v]) => v.count >= 2)
      .sort((a, b) => b[1].count - a[1].count)[0];

    const emoji = crit > 0 ? "🔴" : warn > 0 ? "🟡" : "🟢";
    let txt = `${emoji} *${emp}* (${eu.length} unidade${eu.length !== 1 ? "s" : ""}): `;

    const parts: string[] = [];
    if (crit > 0) parts.push(`${crit} crítica${crit !== 1 ? "s" : ""}`);
    if (warn > 0) parts.push(`${warn} em atenção`);
    if (safe > 0) parts.push(`${safe} em dia`);
    txt += parts.join(", ") + ".";

    if (vis.length > 0) {
      txt += ` Vistoria pendente: unidade${vis.length !== 1 ? "s" : ""} ${vis.map((u) => u.unid).join(", ")} (até ${in7.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}).`;
    }

    if (top && top.risk.level !== "safe") {
      txt += ` Maior risco: *${top.unid}* — ${top.pct}% concluído, score ${top.risk.score}`;
      if (top.risk.factors[0]) txt += ` (${top.risk.factors[0].label})`;
      txt += ".";
    }

    if (topG) {
      const [nome, { count, desvios }] = topG;
      const avg =
        desvios.length > 0
          ? Math.round(desvios.reduce((a, b) => a + b, 0) / desvios.length)
          : null;
      txt += ` Gargalo: _${nome}_ em aberto em ${count} unidades`;
      if (avg && avg > 0) txt += `, desvio médio de ${avg} dias`;
      txt += ".";
    }

    sections.push(txt);
  }

  sections.push(`\n_Gerado via Radar de Risco · Seazone Decor_`);
  return sections.join("\n\n");
}
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
function BriefingModal({
  text,
  onClose,
}: {
  text: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5">
          <div className="flex items-center gap-2 font-semibold text-[#171E37]">
            <FileText className="h-4 w-4" />
            Briefing Semanal
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
            {text}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-black/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#171E37] text-white rounded-xl hover:bg-[#1f2a4a] transition-colors"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copiado!" : "Copiar texto"}
          </button>
        </div>
      </div>
    </div>
  );
}
function RadarRiscoPage() {
  const { units, loading, error, lastSynced, refresh } = useRiskData();
  const [showBriefing, setShowBriefing] = useState(false);
const [briefingText, setBriefingText] = useState("");

function handleGenerateBriefing() {
  setBriefingText(generateBriefingText(units));
  setShowBriefing(true);
}
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
     {/* Botões topo */}
      <div className="flex justify-end gap-2 mb-4">
        {units.length > 0 && (
          <button
            onClick={handleGenerateBriefing}
            className="inline-flex items-center gap-2 rounded-lg bg-[#171E37] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1f2a4a] transition"
          >
            <FileText size={14} />
            Gerar Briefing
          </button>
        )}
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
 {showBriefing && (
        <BriefingModal
          text={briefingText}
          onClose={() => setShowBriefing(false)}
        />
      )}
    </AppShell>
  );
}
