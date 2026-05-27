import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EMPREENDIMENTOS, UNIDADES, formatBRL } from "@/data/seazone";
import { useSheetData } from "@/hooks/useSheetData";

export const Route = createFileRoute("/compras")({
  head: () => ({
    meta: [
      { title: "Compras — Seazone Decor" },
      { name: "description", content: "Compras, fornecedores e prazos de entrega para todas as obras." },
    ],
  }),
  component: ComprasPage,
});

function ComprasPage() {
  const [emp, setEmp] = useState("todos");
  const [un, setUn] = useState("todos");
  const [st, setSt] = useState("todos");
  const { compras } = useSheetData();

  const filtered = useMemo(() => {
    return compras.filter((c) => {
      if (emp !== "todos" && c.empreendimento !== emp && c.empreendimento !== "Todos") return false;
      if (un !== "todos" && !c.unidades.includes(un)) return false;
      // Status simplificado: "Entregue" ou "Aguardando" (tudo que não é Entregue)
      if (st === "Entregue" && c.status !== "Entregue") return false;
      if (st === "Aguardando" && c.status === "Entregue") return false;
      return true;
    });
  }, [compras, emp, un, st]);

  // KPIs calculados sobre os itens filtrados
  const kpis = useMemo(() => [
    {
      label: "Valor Total Gasto",
      value: formatBRL(filtered.reduce((s, c) => s + c.valorTotal, 0)),
    },
    {
      label: "Aguardando",
      value: `${filtered.filter((c) => c.status !== "Entregue").length} itens`,
    },
    {
      label: "Entregues",
      value: `${filtered.filter((c) => c.status === "Entregue").length} itens`,
    },
  ], [filtered]);

  const unidadesUnicas = Array.from(new Set(UNIDADES.map((u) => u.unidade))).sort();

  return (
    <AppShell title="Compras" subtitle="Pedidos, fornecedores e prazos de entrega">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-xs text-muted-foreground font-medium">{k.label}</div>
            <div className="text-2xl font-semibold mt-2 text-foreground tabular-nums">{k.value}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select value={emp} onValueChange={setEmp}>
            <SelectTrigger><SelectValue placeholder="Empreendimento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os empreendimentos</SelectItem>
              {EMPREENDIMENTOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={un} onValueChange={setUn}>
            <SelectTrigger><SelectValue placeholder="Unidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as unidades</SelectItem>
              {unidadesUnicas.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={st} onValueChange={setSt}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="Entregue">Entregue</SelectItem>
              <SelectItem value="Aguardando">Aguardando</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-4 py-3">Categoria</th>
                <th className="text-left font-medium px-4 py-3">Produto</th>
                <th className="text-right font-medium px-4 py-3">Qtde</th>
                <th className="text-left font-medium px-4 py-3">Unidades</th>
                <th className="text-right font-medium px-4 py-3">Valor Total</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.codigo || i} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{c.categoria || "—"}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{c.produto}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{c.qtde}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate" title={c.unidades}>{c.unidades}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">{formatBRL(c.valorTotal)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status === "Entregue" ? "Entregue" : "Aguardando"} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhuma compra encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
