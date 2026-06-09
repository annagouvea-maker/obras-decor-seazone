import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { EMPREENDIMENTOS, unidadeSlug, etapasParaUnidade, personalizacaoUnidade, type Unidade } from "@/data/seazone";
import { useSheetData } from "@/hooks/useSheetData";
import { AIAgentPanel } from "@/components/AIAgentPanel";
import { UnitData } from "@/hooks/useAIAnalysis";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { AlertTriangle, AlertCircle, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão Geral — Seazone Decor" },
      { name: "description", content: "Painel de gestão de obras e empreendimentos Seazone Decor." },
    ],
  }),
  component: VisaoGeral,
});

// Uma cor por empreendimento — paleta oficial Seazone Decor
const EMP_COLORS: Record<string, string> = {
  "Urubici Spot":     "#1e9bc0",  // cerulean
  "Penha Spot":       "#c9a020",  // gold
  "MOV Perdizes":     "#1aab8b",  // teal
  "House Espatódeas": "#171E37",  // navy oficial Seazone
  "House Graça":      "#7A9E8C",  // verde-acinzentado
};
function empColor(nome: string) {
  return EMP_COLORS[nome] ?? "#1a1f3c";
}

function toUnitData(unidades: typeof useSheetData extends () => infer R ? R["unidades"] : never): UnitData[] {
  return unidades.map((u) => {
    const etapas = etapasParaUnidade(u.percentual);
    const pers = personalizacaoUnidade(u);
    const alertas: string[] = [];
    if (u.status === "Atrasada") alertas.push("Obra atrasada");
    if (u.status === "Atenção Prazo") alertas.push("Atenção ao prazo");
    return {
      emp: u.empreendimento,
      und: u.unidade,
      adm: u.adm,
      pacote: u.pacote,
      pers: pers.itensExtras.length > 0,
      pct: u.percentual,
      prazo: u.prazo,
      alertas: alertas.length ? alertas : undefined,
      pendentes: etapas
        .filter((e) => e.status !== "Finalizado")
        .map((e) => ({
          nome: e.nome,
          status: e.status,
          pct: e.status === "Em Andamento" ? Math.min(100, Math.max(0, u.percentual)) : 0,
        })),
    };
  });
}

function VisaoGeral() {
  const { unidades } = useSheetData();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const total      = unidades.length;
    const concluidas = unidades.filter((u) => u.status === "Concluída").length;
    const emObra     = total - concluidas;
    const emDia      = unidades.filter((u) => u.status === "Em Dia").length;
    const atencao    = unidades.filter((u) => u.status === "Atenção Prazo").length;
    const atrasada   = unidades.filter((u) => u.status === "Atrasada").length;
    return { total, concluidas, emObra, emDia, atencao, atrasada };
  }, [unidades]);

  const kpiCards = [
    { label: "Unidades em Obra", value: stats.emObra,     accent: "#1a1f3c", textColor: "#1a1f3c", filter: "todos"         },
    { label: "Concluídas",       value: stats.concluidas, accent: "#94a3b8", textColor: "#6B7280", filter: "Concluída"     },
    { label: "Em Dia",           value: stats.emDia,      accent: "#1aab8b", textColor: "#1aab8b", filter: "Em Dia"        },
    { label: "Atenção Prazo",    value: stats.atencao,    accent: "#c9a020", textColor: "#c9a020", filter: "Atenção Prazo" },
    { label: "Atrasadas",        value: stats.atrasada,   accent: "#DC2626", textColor: "#DC2626", filter: "Atrasada"      },
  ];

  const progressoEmp = useMemo(
    () =>
      EMPREENDIMENTOS.map((nome) => {
        const units = unidades.filter((u) => u.empreendimento === nome);
        const avg   = units.length > 0
          ? Math.round(units.reduce((s, u) => s + u.percentual, 0) / units.length)
          : 0;
        return { nome, valor: avg };
      }),
    [unidades],
  );

  const statusData = useMemo(
    () =>
      [
        { name: "Em Dia",        value: stats.emDia,      color: "#1CA095" }, // verde água
        { name: "Atenção Prazo", value: stats.atencao,    color: "#DCAB1E" }, // mostarda
        { name: "Atrasada",      value: stats.atrasada,   color: "#EF4444" }, // vermelho alerta
        { name: "Concluída",     value: stats.concluidas, color: "#94a3b8" }, // mesmo cinza do KPI "Concluídas"
      ].filter((d) => d.value > 0),
    [stats],
  );

  const alertas = useMemo(
    () => unidades.filter((u) => u.status === "Atenção Prazo" || u.status === "Atrasada"),
    [unidades],
  );

  return (
    <AppShell title="Visão Geral" subtitle="Acompanhamento consolidado dos empreendimentos">

      {/* ── 5 KPI Cards clicáveis ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {kpiCards.map((k) => (
          <button
            key={k.label}
            onClick={() => navigate({ to: "/obras", search: { status: k.filter } })}
            className="group bg-white rounded-2xl p-5 text-left shadow-sm border border-black/5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 relative overflow-hidden"
          >
            {/* Barra de acento superior */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
              style={{ background: k.accent }}
            />
            <div className="mb-3 mt-1">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide leading-tight">
                {k.label}
              </span>
            </div>
            <div className="text-3xl font-semibold tabular-nums" style={{ color: k.textColor }}>
              {k.value}
            </div>
            <div className="mt-2 text-[11px] text-gray-300 group-hover:text-gray-400 transition-colors">
              Ver unidades →
            </div>
          </button>
        ))}
      </div>

      {/* ── Gráficos ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">

        {/* Barras finas — progresso por empreendimento */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-black/5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-[#1a1f3c]" />
            <h2 className="font-semibold text-[#1a1f3c] text-sm">Progresso por Empreendimento</h2>
          </div>
          <p className="text-xs text-gray-400 mb-5">Percentual médio de execução</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={progressoEmp}
                layout="vertical"
                margin={{ left: 0, right: 36, top: 0, bottom: 0 }}
                barCategoryGap="40%"
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  fontSize={10}
                  tick={{ fill: "#d1d5db" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={135}
                  fontSize={11}
                  tick={{ fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [`${v}%`, "Progresso"]}
                  cursor={{ fill: "#f9fafb" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                  }}
                />
                <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={8}>
                  {progressoEmp.map((entry) => (
                    <Cell key={entry.nome} fill={empColor(entry.nome)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legenda inline */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {progressoEmp.map((e) => (
              <span key={e.nome} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: empColor(e.nome) }} />
                {e.nome}
              </span>
            ))}
          </div>
        </div>

        {/* Donut — status */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex flex-col">
          <h2 className="font-semibold text-[#1a1f3c] text-sm mb-1">Status das Obras</h2>
          <p className="text-xs text-gray-400 mb-2">Distribuição por situação</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {statusData.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: "#6b7280" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Alertas ───────────────────────────────────────────────── */}
      {alertas.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
          <h2 className="font-semibold text-[#1a1f3c] text-sm mb-1">Obras que precisam de atenção</h2>
          <p className="text-xs text-gray-400 mb-5">
            {alertas.length} unidade{alertas.length !== 1 ? "s" : ""} requerem acompanhamento
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {alertas.map((u) => {
              const atrasada    = u.status === "Atrasada";
              const Icon        = atrasada ? AlertCircle : AlertTriangle;
              const accentColor = atrasada ? "#DC2626" : "#c9a020";
              return (
                <Link
                  key={u.empreendimento + u.unidade}
                  to="/obras/$id"
                  params={{ id: unidadeSlug(u) }}
                  className={`block rounded-2xl border p-4 bg-white hover:shadow-sm transition-all duration-150 ${atrasada ? "border-red-100" : "border-amber-100"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" style={{ color: accentColor }} />
                      <div className="font-semibold text-sm text-[#1a1f3c]">
                        {u.empreendimento}
                        <span className="font-normal text-gray-400 ml-1 text-xs">{u.unidade}</span>
                      </div>
                    </div>
                    <StatusBadge status={u.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-gray-400">ADM: <span className="text-gray-700 font-medium">{u.adm}</span></span>
                    <span className="font-semibold tabular-nums" style={{ color: accentColor }}>{u.percentual}%</span>
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${u.percentual}%`, backgroundColor: accentColor }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
