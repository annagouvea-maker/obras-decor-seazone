import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex w-full bg-[#f4f6fb]">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-black/5 px-8 py-5">
          <h1 className="text-xl font-bold tracking-tight text-[#00153e]">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </header>
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
    "Em Dia":        { bg: "bg-emerald-50",  fg: "text-emerald-700", dot: "bg-emerald-500", label: "Em Dia" },
    "Atenção Prazo": { bg: "bg-amber-50",    fg: "text-amber-700",   dot: "bg-amber-400",   label: "Atenção Prazo" },
    "Atrasada":      { bg: "bg-red-50",      fg: "text-red-600",     dot: "bg-red-500",     label: "Atrasada" },
    "Concluída":     { bg: "bg-slate-100",   fg: "text-slate-500",   dot: "bg-slate-400",   label: "Concluída" },
    "Em Andamento":  { bg: "bg-blue-50",     fg: "text-blue-700",    dot: "bg-blue-400",    label: "Em Andamento" },
    "Não Iniciado":  { bg: "bg-gray-100",    fg: "text-gray-500",    dot: "bg-gray-300",    label: "Não Iniciado" },
    "Finalizado":    { bg: "bg-emerald-50",  fg: "text-emerald-700", dot: "bg-emerald-500", label: "Finalizado" },
    "Entregue":      { bg: "bg-emerald-50",  fg: "text-emerald-700", dot: "bg-emerald-500", label: "Entregue" },
    "Previsto":      { bg: "bg-blue-50",     fg: "text-blue-600",    dot: "bg-blue-400",    label: "Previsto" },
    "Pendente":      { bg: "bg-gray-100",    fg: "text-gray-500",    dot: "bg-gray-300",    label: "Pendente" },
    "Atrasado":      { bg: "bg-red-50",      fg: "text-red-600",     dot: "bg-red-500",     label: "Atrasado" },
    "Aguardando":    { bg: "bg-gray-100",    fg: "text-gray-500",    dot: "bg-gray-300",    label: "Aguardando" },
  };
  const s = map[status] ?? map["Não Iniciado"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.fg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[130px]">
      <div className="h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#00153e]/50"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-500 tabular-nums w-9 text-right">
        {value}%
      </span>
    </div>
  );
}
