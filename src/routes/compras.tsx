import { useState, useMemo } from "react";
import { RefreshCw, ShoppingCart, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useComprasData } from "@/hooks/useComprasData";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/compras")({
  component: ComprasPage,
});

const STATUS_COLORS: Record<string, string> = {
  entregue: "bg-green-500/20 text-green-300",
  finalizado: "bg-green-500/20 text-green-300",
  pendente: "bg-yellow-500/20 text-yellow-300",
  devolvido: "bg-orange-500/20 text-orange-300",
  devolução: "bg-orange-500/20 text-orange-300",
  cancelado: "bg-red-500/20 text-red-300",
};

function statusColor(s: string) {
  return STATUS_COLORS[s.toLowerCase()] ?? "bg-gray-500/20 text-gray-300";
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <div className="text-xs text-white/50 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold text-white mt-1">{value}</div>
    </div>
  );
}

function ComprasPage() {
  const { compras, loading, error, lastUpdated, refresh } = useComprasData();
  const [search, setSearch] = useState("");
  const [filterEmp, setFilterEmp] = useState("Todos");
  const [filterCat, setFilterCat] = useState("Todas");
  const [filterStatus, setFilterStatus] = useState("Todos");

  const empreendimentos = useMemo(
    () => ["Todos", ...Array.from(new Set(compras.map((c) => c.empreendimento))).sort()],
    [compras]
  );
  const categorias = useMemo(
    () => ["Todas", ...Array.from(new Set(compras.map((c) => c.categoria).filter(Boolean))).sort()],
    [compras]
  );
  const statuses = useMemo(
    () => ["Todos", ...Array.from(new Set(compras.map((c) => c.statusEntrega).filter(Boolean))).sort()],
    [compras]
  );

  const filtered = useMemo(() => {
    return compras.filter((c) => {
      if (filterEmp !== "Todos" && c.empreendimento !== filterEmp) return false;
      if (filterCat !== "Todas" && c.categoria !== filterCat) return false;
      if (filterStatus !== "Todos" && c.statusEntrega !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !c.produto.toLowerCase().includes(q) &&
          !c.empreendimento.toLowerCase().includes(q) &&
          !c.categoria.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [compras, filterEmp, filterCat, filterStatus, search]);

  const totalGasto = filtered.reduce((s, c) => s + c.valorTotal, 0);
  const entregues = filtered.filter((c) =>
    ["entregue", "finalizado"].includes(c.statusEntrega.toLowerCase())
  ).length;
  const pendentes = filtered.filter(
    (c) => !c.statusEntrega || c.statusEntrega.toLowerCase() === "pendente"
  ).length;

  return (
    <AppShell title="Compras" subtitle="Pedidos e entregas das obras">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-white/70" />
            <div>
              <div className="text-lg font-semibold text-white">Compras</div>
              {lastUpdated && (
                <div className="text-xs text-white/40">
                  Atualizado{" "}
                  {lastUpdated.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Pedidos" value={String(filtered.length)} />
          <KpiCard label="Total gasto" value={fmt(totalGasto)} />
          <KpiCard label="Entregues" value={String(entregues)} />
          <KpiCard label="Pendentes" value={String(pendentes)} />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 w-48"
            />
          </div>
          {[
            { label: "Empreendimento", options: empreendimentos, value: filterEmp, set: setFilterEmp },
            { label: "Categoria", options: categorias, value: filterCat, set: setFilterCat },
            { label: "Status", options: statuses, value: filterStatus, set: setFilterStatus },
          ].map(({ label, options, value, set }) => (
            <select
              key={label}
              value={value}
              onChange={(e) => set(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
            >
              {options.map((o) => (
                <option key={o} value={o} className="bg-zinc-900">
                  {o}
                </option>
              ))}
            </select>
          ))}
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="text-white/60 text-sm">Carregando...</div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/60 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Empreendimento</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-left">Produto</th>
                  <th className="px-4 py-3 text-left">Unidades</th>
                  <th className="px-4 py-3 text-right">Valor Total</th>
                  <th className="px-4 py-3 text-left">Data Pedido</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={i} className="border-t border-white/5 text-white/80 hover:bg-white/5">
                    <td className="px-4 py-3">{c.empreendimento}</td>
                    <td className="px-4 py-3">{c.categoria}</td>
                    <td className="px-4 py-3">{c.produto}</td>
                    <td className="px-4 py-3">{c.unidades}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {c.valorTotal > 0 ? fmt(c.valorTotal) : "—"}
                    </td>
                    <td className="px-4 py-3">{c.dataPedido}</td>
                    <td className="px-4 py-3">
                      {c.statusEntrega ? (
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${statusColor(
                            c.statusEntrega
                          )}`}
                        >
                          {c.statusEntrega}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-white/40">
                      Nenhum resultado encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}