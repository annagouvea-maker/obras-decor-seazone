import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, HardHat, ShoppingCart, UserCog } from "lucide-react";

function SeazoneLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* House body + roof com buraco circular — evenodd cria o "O" */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M50 8 L87 47 L74 47 L74 91 L26 91 L26 47 L13 47 Z
           M50 53 A19 19 0 1 0 50.001 53 Z"
        fill="#fc605b"
      />
      {/* Chaminé */}
      <rect x="60" y="9" width="11" height="22" rx="3" fill="#fc605b" />
    </svg>
  );
}

const items = [
  { to: "/",        label: "Visão Geral",  icon: LayoutDashboard },
  { to: "/obras",   label: "Obras",        icon: HardHat },
  { to: "/compras", label: "Compras",      icon: ShoppingCart },
  { to: "/adm",     label: "Área do ADM",  icon: UserCog },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[#00153e] rounded-r-3xl">
      {/* Logo + marca */}
      <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
        <SeazoneLogo />
        <div className="mt-3 font-bold text-white text-[15px] tracking-tight leading-tight">
          Seazone Decor
        </div>
        <div className="text-[11px] text-white/40 mt-1 uppercase tracking-widest">
          Gestão de obras
        </div>
      </div>

      {/* Divisor */}
      <div className="mx-5 border-t border-white/10" />

      {/* Navegação */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {items.map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-[#fc605b] text-white shadow-md shadow-[#fc605b]/30"
                  : "text-white/50 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="px-6 py-5 border-t border-white/10">
        <p className="text-[10px] text-white/25 text-center tracking-wide">
          Seazone Decor © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
