import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutDashboard, HardHat, ShoppingCart } from "lucide-react";

const items = [
  { to: "/", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/obras", label: "Obras", icon: HardHat },
  { to: "/compras", label: "Compras", icon: ShoppingCart },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar-dark text-sidebar-dark-foreground">
      <div className="px-5 py-5 border-b border-sidebar-dark-border flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <Home className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="font-semibold tracking-tight text-sm">Seazone Decor</div>
          <div className="text-[11px] text-sidebar-dark-muted">Gestão de obras</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-sidebar-dark-active text-white"
                  : "text-sidebar-dark-muted hover:bg-sidebar-dark-active hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-dark-border flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
          A
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">Anna</div>
          <div className="text-[11px] text-sidebar-dark-muted truncate">Administradora</div>
        </div>
      </div>
    </aside>
  );
}