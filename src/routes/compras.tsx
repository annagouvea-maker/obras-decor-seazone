import { useState, useMemo } from "react";
import { RefreshCw, ShoppingCart, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useComprasData } from "@/hooks/useComprasData";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/compras")({
  component: ComprasPage,
});

const STATUS_COLORS: Record<string, string> = {
  entregue: "bg-green-50 text-green-600",
  finalizado: "bg-green-50 text-green-600",
  pendente: "bg-amber-50 text-amber-600",
  devolvido: "bg-orange-50 text-orange-600",
  "devolução": "bg-orange-50 text-orange-600",
  cancelado: "bg-red-50 text-red-600",
};

function statusColor(s: string) {
  return STATUS_COLORS[s.toLowerCase()] ?? "bg-gray-100 text-gray-500";
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-5 flex flex-col gap-3">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-3xl font-semibold text-[#171E37] tabular-nums">{value}</div>
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-[#171E37]" />
          <div>
            <div className="text-lg font-semibold text-[#171E37]">Compras</div>
            {lastUpdated && (
              <div className="text-xs text-gray-500">
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
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-[#171E37] hover:border-[#171E37] disabled:opacity-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Pedidos" value={String(filtered.length)} />
        <KpiCard label="Total gasto" value={fmt(totalGasto)} />
        <KpiCard label="Entregues" value={String(entregues)} />
        <KpiCard label="Pendentes" value={String(pendentes)} />
      </div>

      {/* Erro */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="pl-8 pr-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-[#171E37] placeholder:text-gray-400 focus:outline-none focus:border-[#171E37] w-48"
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
            className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-[#171E37] focus:outline-none focus:border-[#171E37]"
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ))}
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-white border border-gray-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Empreendimento</th>
                <th className="px-4 py-3 text-left font-medium">Categoria</th>
                <th className="px-4 py-3 text-left font-medium">Produto</th>
                <th className="px-4 py-3 text-left font-medium">Unidades</th>
                <th className="px-4 py-3 text-right font-medium">Valor Total</th>
                <th className="px-4 py-3 text-left font-medium">Data Pedido</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} className="border-t border-gray-100 text-gray-700 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">{c.empreendimento}</td>
                  <td className="px-4 py-3">{c.categoria}</td>
                  <td className="px-4 py-3">{c.produto}</td>
                  <td className="px-4 py-3">{c.unidades}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-[#171E37]">
                    {c.valorTotal > 0 ? fmt(c.valorTotal) : "—"}
                  </td>
                  <td className="px-4 py-3">{c.dataPedido}</td>
                  <td className="px-4 py-3">
                    {c.statusEntrega ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(
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
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Nenhum resultado encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
