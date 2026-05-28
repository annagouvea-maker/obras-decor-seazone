import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

function SeazoneLogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Seazone"
    >
      <rect x="62" y="3" width="14" height="30" rx="7" fill="#fc605b" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M50 14 C53 14 84 39 88 48 C92 57 85 63 78 57 L78 84 Q78 94 66 94 L34 94 Q22 94 22 82 L22 57 C15 63 8 57 12 48 C16 39 47 14 50 14 Z M32 67 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0"
        fill="#fc605b"
      />
    </svg>
  );
}

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
    <div className="min-h-screen flex w-full bg-[#F1F3F4]">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="bg-[#F1F3F4] border-b border-black/5 px-6 lg:px-8 py-5 flex items-center gap-3">
          <div className="lg:hidden shrink-0">
            <SeazoneLogoMark size={32} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-medium tracking-tight text-[#171E37] truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </header>
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
    "Em Dia":        { bg: "bg-[#1aab8b]/10", fg: "text-[#1aab8b]", dot: "bg-[#1aab8b]",  label: "Em Dia" },
    "Atenção Prazo": { bg: "bg-[#c9a020]/10", fg: "text-[#c9a020]", dot: "bg-[#c9a020]",  label: "Atenção Prazo" },
    "Atrasada":      { bg: "bg-red-50",        fg: "text-red-600",   dot: "bg-red-500",    label: "Atrasada" },
    "Concluída":     { bg: "bg-slate-100",     fg: "text-slate-500", dot: "bg-slate-400",  label: "Concluída" },
    "Em Andamento":  { bg: "bg-[#1e9bc0]/10", fg: "text-[#1e9bc0]", dot: "bg-[#1e9bc0]",  label: "Em Andamento" },
    "Não Iniciado":  { bg: "bg-gray-100",      fg: "text-gray-500",  dot: "bg-gray-300",   label: "Não Iniciado" },
    "Finalizado":    { bg: "bg-[#1aab8b]/10", fg: "text-[#1aab8b]", dot: "bg-[#1aab8b]",  label: "Finalizado" },
    "Entregue":      { bg: "bg-[#1aab8b]/10", fg: "text-[#1aab8b]", dot: "bg-[#1aab8b]",  label: "Entregue" },
    "Previsto":      { bg: "bg-[#1e9bc0]/10", fg: "text-[#1e9bc0]", dot: "bg-[#1e9bc0]",  label: "Previsto" },
    "Pendente":      { bg: "bg-gray-100",      fg: "text-gray-500",  dot: "bg-gray-300",   label: "Pendente" },
    "Atrasado":      { bg: "bg-red-50",        fg: "text-red-600",   dot: "bg-red-500",    label: "Atrasado" },
    "Aguardando":    { bg: "bg-gray-100",      fg: "text-gray-500",  dot: "bg-gray-300",   label: "Aguardando" },
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
