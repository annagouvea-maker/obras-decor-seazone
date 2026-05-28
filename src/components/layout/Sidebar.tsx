import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, HardHat, ShoppingCart, UserCog } from "lucide-react";

// Constantes de cor para o efeito notch
const SIDEBAR_BG = "#1a1f3c";
const PAGE_BG    = "#eef0f1";
const GOLD       = "#c9a020";

function SeazoneLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M50 8 L87 47 L74 47 L74 91 L26 91 L26 47 L13 47 Z
           M50 53 A19 19 0 1 0 50.001 53 Z"
        fill="#fc605b"
      />
      <rect x="60" y="9" width="11" height="22" rx="3" fill="#fc605b" />
    </svg>
  );
}

const items = [
  { to: "/",        label: "Visão Geral", icon: LayoutDashboard },
  { to: "/obras",   label: "Obras",       icon: HardHat },
  { to: "/compras", label: "Compras",     icon: ShoppingCart },
  { to: "/adm",     label: "Área do ADM", icon: UserCog },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className="hidden lg:flex w-64 shrink-0 flex-col rounded-r-3xl"
      style={{ background: SIDEBAR_BG }}
    >
      {/* Logo */}
      <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
        <SeazoneLogo />
        <div
          className="mt-3 text-[15px] tracking-tight leading-tight"
          style={{ color: "rgba(255,255,255,0.95)", fontWeight: 500 }}
        >
          Seazone Decor
        </div>
        <div
          className="text-[10px] mt-1 uppercase tracking-[0.2em]"
          style={{ color: "rgba(255,255,255,0.35)", fontWeight: 300 }}
        >
          Gestão de obras
        </div>
      </div>

      {/* Divisor */}
      <div className="mx-5 border-t border-white/10" />

      {/* Nav com notch effect */}
      <nav className="flex-1 py-5">
        {items.map((it) => {
          const active = pathname === it.to;
          const Icon = it.icon;

          return (
            <div key={it.to} className="relative mb-0.5">

              <Link
                to={it.to}
                className="flex items-center gap-3 text-[13px] transition-all duration-150 outline-none"
                style={
                  active
                    ? {
                        background:   PAGE_BG,
                        color:        SIDEBAR_BG,
                        borderRadius: "1rem 0 0 1rem",   /* rounded left, flat right */
                        marginLeft:   "1rem",
                        padding:      "0.75rem 1.5rem",
                        fontWeight:   500,
                      }
                    : {
                        color:        "rgba(255,255,255,0.45)",
                        borderRadius: "0.75rem",
                        margin:       "0 1rem",
                        padding:      "0.7rem 1rem",
                        fontWeight:   400,
                      }
                }
              >
                <Icon
                  className="h-[17px] w-[17px] shrink-0"
                  style={{ color: active ? GOLD : "inherit" }}
                />
                <span className="tracking-wide">{it.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="px-6 py-5 border-t border-white/10">
        <p
          className="text-[10px] text-center tracking-widest"
          style={{ color: "rgba(255,255,255,0.2)", fontWeight: 300 }}
        >
          Seazone Decor © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
