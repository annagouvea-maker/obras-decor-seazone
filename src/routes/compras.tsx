import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EMPREENDIMENTOS, formatBRL } from "@/data/seazone";
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

// "403, 503 e 502"  →  ["403", "503", "502"]
function splitUnidades(raw: string): string[] {
  return raw.split(/,\s*|\s+e\s+/).map((u) => u.trim()).filter(Boolean);
}

function ComprasPage() {
  const [emp, setEmp] = useState("todos");
  const [un, setUn]   = useState("todos");
  const [st, setSt]   = useState("todos");
  const { compras } = useSheetData();

  // Quando o empreendimento muda, reseta a unidade selecionada
  useEffect(() => {
    setUn("todos");
  }, [emp]);

  // Lista de unidades filtrada pelo empreendimento selecionado
  const unidadesUnicas = useMemo(() => {
    const set = new Set<string>();
    const fonte = emp === "todos"
      ? compras
      : compras.filter((c) => c.empreendimento === emp);
    fonte.forEach((c) => {
      splitUnidades(c.unidades || "").forEach((u) => {
        // Ignora entradas genéricas como "Todas as unidades", "14 unidades", etc.
        if (/^\d+$/.test(u)) set.add(u);
      });
    });
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [compras, emp]);

  const filtered = useMemo(() => {
    return compras.filter((c) => {
      if (emp !== "todos" && c.empreendimento !== emp) return false;
      if (un !== "todos") {
        const lista = splitUnidades(c.unidades || "");
        if (!lista.includes(un)) return false;
      }
      if (st === "Entregue"  && c.status !== "Entregue") return false;
      if (st === "Aguardando" && c.status === "Entregue") return false;
      return true;
    });
  }, [compras, emp, un, st]);

  const totalGasto    = filtered.reduce((s, c) => s + c.valorTotal, 0);
  const totalAguardando = filtered.filter((c) => c.status !== "Entregue").length;
  const totalEntregue   = filtered.filter((c) => c.status === "Entregue").length;

  return (
    <AppShell title="Compras" subtitle={`${filtered.length} de ${compras.length} itens`}>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/5">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Valor Total Gasto
          </div>
          <div className="text-2xl font-semibold tabular-nums text-[#1a1f3c]">
            {formatBRL(totalGasto)}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/5">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Aguardando Entrega
          </div>
          <div className="text-2xl font-semibold tabular-nums text-[#c9a020]">
            {totalAguardando} <span className="text-sm font-normal text-gray-400">itens</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/5">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Entregues
          </div>
          <div className="text-2xl font-semibold tabular-nums text-[#1aab8b]">
            {totalEntregue} <span className="text-sm font-normal text-gray-400">itens</span>
          </div>
        </div>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 mb-5 shadow-sm border border-black/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select value={emp} onValueChange={setEmp}>
            <SelectTrigger className="rounded-xl border-gray-200 text-sm">
              <SelectValue placeholder="Empreendimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os empreendimentos</SelectItem>
              {EMPREENDIMENTOS.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={un} onValueChange={setUn}>
            <SelectTrigger className="rounded-xl border-gray-200 text-sm">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as unidades</SelectItem>
              {unidadesUnicas.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={st} onValueChange={setSt}>
            <SelectTrigger className="rounded-xl border-gray-200 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="Entregue">Entregue</SelectItem>
              <SelectItem value="Aguardando">Aguardando</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Tabela ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-32" />   {/* Empreendimento */}
              <col className="w-24" />   {/* Categoria */}
              <col className="w-44" />   {/* Produto */}
              <col className="w-12" />   {/* Qtde */}
              <col className="w-20" />   {/* Unidades */}
              <col className="w-28" />   {/* Valor Total */}
              <col className="w-28" />   {/* Status */}
            </colgroup>
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">
                  Empreendimento
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">
                  Categoria
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">
                  Produto
                </th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">
                  Qtde
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">
                  Unidades
                </th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">
                  Valor Total
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={`${c.empreendimento}-${c.codigo || i}`}
                  className="border-b border-gray-50 hover:bg-[#f8f9fb] transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-gray-400 truncate" title={c.empreendimento}>
                    {c.empreendimento || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 truncate" title={c.categoria}>
                    {c.categoria || "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#1a1f3c] truncate" title={c.produto}>
                    {c.produto}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-sm text-gray-600">
                    {c.qtde}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 truncate" title={c.unidades}>
                    {c.unidades || "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold text-[#1a1f3c]">
                    {formatBRL(c.valorTotal)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status === "Entregue" ? "Entregue" : "Aguardando"} />
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-gray-400">
                    Nenhuma compra encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
