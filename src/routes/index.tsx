import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { EMPREENDIMENTOS, unidadeSlug } from "@/data/seazone";
import { useSheetData } from "@/hooks/useSheetData";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, PieChart, Pie, Legend,
} from "recharts";
import { AlertTriangle, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão Geral — Seazone Decor" },
      { name: "description", content: "Painel de gestão de obras e empreendimentos Seazone Decor." },
    ],
  }),
  component: VisaoGeral,
});

function toneClass(tone: string) {
  switch (tone) {
    case "atencao": return "text-status-atencao";
    case "atrasada": return "text-status-atrasada";
    case "em-dia": return "text-status-em-dia";
    default: return "text-foreground";
  }
}

function VisaoGeral() {
  const { unidades } = useSheetData();

  const kpis = useMemo(() => {
    const total = unidades.length;
    const concluidas = unidades.filter((u) => u.status === "Concluída").length;
    const emObra = total - concluidas;
    const avgPct = total > 0 ? Math.round(unidades.reduce((s, u) => s + u.percentual, 0) / total) : 0;
    const atencao = unidades.filter((u) => u.status === "Atenção Prazo").length;
    const atrasada = unidades.filter((u) => u.status === "Atrasada").length;
    const emDia = unidades.filter((u) => u.status === "Em Dia").length;
    return [
      { label: "Unidades em Obra", value: String(emObra), tone: "default" },
      { label: "Concluídas", value: String(concluidas), tone: "default" },
      { label: "Avanço Médio", value: `${avgPct}%`, tone: "default" },
      { label: "Atenção: Prazo", value: String(atencao), tone: "atencao" },
      { label: "Obras Atrasadas", value: String(atrasada), tone: "atrasada" },
      { label: "Em Dia", value: String(emDia), tone: "em-dia" },
    ] as { label: string; value: string; tone: string }[];
  }, [unidades]);

  const progressoEmp = useMemo(
    () =>
      EMPREENDIMENTOS.map((nome) => {
        const units = unidades.filter((u) => u.empreendimento === nome);
        const avg =
          units.length > 0
            ? Math.round(units.reduce((s, u) => s + u.percentual, 0) / units.length)
            : 0;
        return { nome, valor: avg };
      }),
    [unidades],
  );

  const statusData = useMemo(
    () => [
      { name: "Em Dia",       value: unidades.filter((u) => u.status === "Em Dia").length,        color: "#24A148" },
      { name: "Atenção Prazo",value: unidades.filter((u) => u.status === "Atenção Prazo").length,  color: "#F59E0B" },
      { name: "Atrasada",     value: unidades.filter((u) => u.status === "Atrasada").length,       color: "#EF4444" },
      { name: "Concluída",    value: unidades.filter((u) => u.status === "Concluída").length,      color: "#00153e" },
    ],
    [unidades],
  );

  const alertas = useMemo(
    () => unidades.filter((u) => u.status === "Atenção Prazo" || u.status === "Atrasada"),
    [unidades],
  );

  return (
    <AppShell title="Visão Geral" subtitle="Acompanhamento consolidado dos empreendimentos">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-xs text-muted-foreground font-medium">{k.label}</div>
            <div className={`text-2xl font-semibold mt-2 tabular-nums ${toneClass(k.tone)}`}>{k.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <h2 className="font-semibold text-foreground mb-1">Progresso por Empreendimento</h2>
          <p className="text-xs text-muted-foreground mb-4">Percentual médio de execução</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressoEmp} layout="vertical" margin={{ left: 20, right: 30 }}>
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis type="category" dataKey="nome" width={120} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip formatter={(v) => `${v}%`} cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                <Bar dataKey="valor" fill="#00153e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-foreground mb-1">Status das Obras</h2>
          <p className="text-xs text-muted-foreground mb-4">Distribuição por situação</p>
          <div className="h-72 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {statusData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-foreground mb-1">Obras que precisam de atenção</h2>
        <p className="text-xs text-muted-foreground mb-4">{alertas.length} unidades requerem acompanhamento</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {alertas.map((u) => {
            const atrasada = u.status === "Atrasada";
            const Icon = atrasada ? AlertCircle : AlertTriangle;
            return (
              <Link
                key={u.empreendimento + u.unidade}
                to="/obras/$id"
                params={{ id: unidadeSlug(u) }}
                className={`block rounded-lg border p-4 bg-background hover:shadow-sm hover:border-primary/60 transition ${atrasada ? "border-status-atrasada/40" : "border-status-atencao/40"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${atrasada ? "text-status-atrasada" : "text-status-atencao"}`} />
                    <div className="font-medium text-sm text-foreground">{u.empreendimento} {u.unidade}</div>
                  </div>
                  <StatusBadge status={u.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">ADM: <span className="text-foreground font-medium">{u.adm}</span></span>
                  <span className="font-semibold tabular-nums text-foreground">{u.percentual}%</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${atrasada ? "bg-status-atrasada" : "bg-status-atencao"}`} style={{ width: `${u.percentual}%` }} />
                </div>
                <div className={`mt-2 text-[11px] font-medium uppercase tracking-wide ${atrasada ? "text-status-atrasada" : "text-status-atencao"}`}>
                  {atrasada ? "Obra atrasada" : "Atenção: prazo final"}
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
}
