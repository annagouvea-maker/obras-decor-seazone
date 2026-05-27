import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex w-full bg-muted/40">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="bg-background border-b px-6 py-4">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </header>
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
    "Em Dia": { bg: "bg-status-em-dia/10", fg: "text-status-em-dia", dot: "bg-status-em-dia", label: "Em Dia" },
    "Atenção Prazo": { bg: "bg-status-atencao/10", fg: "text-status-atencao", dot: "bg-status-atencao", label: "Atenção Prazo" },
    "Atrasada": { bg: "bg-status-atrasada/10", fg: "text-status-atrasada", dot: "bg-status-atrasada", label: "Atrasada" },
    "Concluída": { bg: "bg-status-concluida/10", fg: "text-status-concluida", dot: "bg-status-concluida", label: "Concluída" },
    "Em Andamento": { bg: "bg-status-andamento/10", fg: "text-status-andamento", dot: "bg-status-andamento", label: "Em Andamento" },
    "Não Iniciado": { bg: "bg-status-nao-iniciado/10", fg: "text-status-nao-iniciado", dot: "bg-status-nao-iniciado", label: "Não Iniciado" },
    "Finalizado": { bg: "bg-status-em-dia/10", fg: "text-status-em-dia", dot: "bg-status-em-dia", label: "Finalizado" },
    "Entregue": { bg: "bg-status-em-dia/10", fg: "text-status-em-dia", dot: "bg-status-em-dia", label: "Entregue" },
    "Previsto": { bg: "bg-status-andamento/10", fg: "text-status-andamento", dot: "bg-status-andamento", label: "Previsto" },
    "Pendente": { bg: "bg-status-nao-iniciado/10", fg: "text-status-nao-iniciado", dot: "bg-status-nao-iniciado", label: "Pendente" },
    "Atrasado": { bg: "bg-status-atrasada/10", fg: "text-status-atrasada", dot: "bg-status-atrasada", label: "Atrasado" },
    "Aguardando": { bg: "bg-status-nao-iniciado/10", fg: "text-muted-foreground", dot: "bg-status-nao-iniciado", label: "Aguardando" },
  };
  const s = map[status] ?? map["Não Iniciado"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.fg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-slate-400" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-foreground tabular-nums w-9 text-right">{value}%</span>
    </div>
  );
}