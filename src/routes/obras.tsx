import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Fragment } from "react";
import { AppShell, StatusBadge, ProgressBar } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  EMPREENDIMENTOS, ADMS, etapaAtualLabel, etapasParaUnidade, unidadeSlug,
} from "@/data/seazone";
import { useSheetData } from "@/hooks/useSheetData";
import { ChevronDown, ChevronRight, Search, Camera } from "lucide-react";

const DRIVE_FOTOS_URL = "https://drive.google.com/drive/folders/1U0PxtQeuURhOY-aFoD0TZvh8WwSkGs61";

export const Route = createFileRoute("/obras")({
  validateSearch: (search: Record<string, unknown>) => ({
    status: typeof search.status === "string" ? search.status : "todos",
  }),
  head: () => ({
    meta: [
      { title: "Obras — Seazone Decor" },
      { name: "description", content: "Listagem e acompanhamento de todas as unidades em obra." },
    ],
  }),
  component: ObrasPage,
});

// ─── Stepper horizontal de etapas ────────────────────────────────────────────
function EtapasStepper({ percentual }: { percentual: number }) {
  const etapas = etapasParaUnidade(percentual);
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-start min-w-max">
        {etapas.map((e, i) => {
          const isDone   = e.status === "Finalizado";
          const isActive = e.status === "Em Andamento";
          const isLast   = i === etapas.length - 1;

          return (
            <div key={i} className="flex items-start">
              {/* Nó + label */}
              <div className="flex flex-col items-center w-[72px]">
                {/* Círculo */}
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                    isDone
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isActive
                      ? "bg-[#1a1f3c] border-[#1a1f3c] text-white ring-4 ring-[#1a1f3c]/15"
                      : "bg-white border-gray-200 text-gray-400"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </div>
                {/* Label */}
                <div
                  className={`mt-2 text-[9px] text-center leading-tight px-0.5 w-full ${
                    isActive
                      ? "text-[#1a1f3c] font-semibold"
                      : isDone
                      ? "text-emerald-600"
                      : "text-gray-400"
                  }`}
                >
                  {e.nome}
                </div>
              </div>

              {/* Linha conectora (exceto após o último) */}
              {!isLast && (
                <div className="flex items-center mt-3.5 w-4 shrink-0">
                  <div
                    className={`h-0.5 w-full ${
                      isDone ? "bg-emerald-400" : "bg-gray-200"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
function ObrasPage() {
  const { status: statusParam } = Route.useSearch();
  const [empFilter, setEmpFilter]     = useState("todos");
  const [statusFilter, setStatusFilter] = useState(statusParam);
  const [admFilter, setAdmFilter]     = useState("todos");
  const [search, setSearch]           = useState("");
  const [expanded, setExpanded]       = useState<string | null>(null);
  const navigate = useNavigate();
  const { unidades } = useSheetData();

  const filtered = useMemo(() => {
    return unidades.filter((u) => {
      if (empFilter   !== "todos" && u.empreendimento !== empFilter) return false;
      if (statusFilter !== "todos" && u.status !== statusFilter)     return false;
      if (admFilter   !== "todos" && u.adm !== admFilter)            return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !u.unidade.toLowerCase().includes(q) &&
          !u.investidor.toLowerCase().includes(q) &&
          !u.empreendimento.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [unidades, empFilter, statusFilter, admFilter, search]);

  return (
    <AppShell title="Obras" subtitle={`${filtered.length} de ${unidades.length} unidades`}>

      {/* ── Filtros ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 mb-5 shadow-sm border border-black/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={empFilter} onValueChange={setEmpFilter}>
            <SelectTrigger className="rounded-xl border-gray-200 text-sm">
              <SelectValue placeholder="Empreendimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os empreendimentos</SelectItem>
              {EMPREENDIMENTOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="rounded-xl border-gray-200 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="Em Dia">Em Dia</SelectItem>
              <SelectItem value="Atenção Prazo">Atenção Prazo</SelectItem>
              <SelectItem value="Atrasada">Atrasada</SelectItem>
              <SelectItem value="Concluída">Concluída</SelectItem>
            </SelectContent>
          </Select>

          <Select value={admFilter} onValueChange={setAdmFilter}>
            <SelectTrigger className="rounded-xl border-gray-200 text-sm">
              <SelectValue placeholder="ADM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as ADMs</SelectItem>
              {ADMS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9 rounded-xl border-gray-200 text-sm"
              placeholder="Buscar unidade, investidor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Tabela ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-10 px-4 py-4" />
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">
                  Unidade
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">
                  Investidor
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">
                  Pacote
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">
                  ADM
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">
                  Etapa Atual
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4 min-w-[160px]">
                  % Concluído
                </th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">
                  Status
                </th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-4">
                  Fotos
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((u) => {
                const id     = u.empreendimento + u.unidade;
                const isOpen = expanded === id;

                return (
                  <Fragment key={id}>
                    {/* ── Linha principal ── */}
                    <tr
                      className={`border-b border-gray-50 cursor-pointer hover:bg-[#f8f9fb] transition-colors ${isOpen ? "bg-[#f8f9fb]" : ""}`}
                      onClick={() => navigate({ to: "/obras/$id", params: { id: unidadeSlug(u) } })}
                    >
                      {/* Expand */}
                      <td
                        className="px-4 py-4"
                        onClick={(e) => { e.stopPropagation(); setExpanded(isOpen ? null : id); }}
                      >
                        <div className="h-6 w-6 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                          {isOpen
                            ? <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                            : <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                          }
                        </div>
                      </td>

                      {/* Unidade + Empreendimento */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-[#1a1f3c]">{u.unidade}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{u.empreendimento}</div>
                      </td>

                      {/* Investidor */}
                      <td className="px-4 py-4 text-sm text-gray-600 max-w-[180px]">
                        <div className="truncate" title={u.investidor}>{u.investidor}</div>
                      </td>

                      {/* Pacote */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          u.pacote === "Premium"
                            ? "bg-[#171E37]/10 text-[#171E37]"
                            : u.pacote === "Plus"
                            ? "bg-[#1A9CB9]/10 text-[#1A9CB9]"
                            : "bg-[#1CA095]/10 text-[#1CA095]"
                        }`}>
                          {u.pacote}
                        </span>
                      </td>

                      {/* ADM */}
                      <td className="px-4 py-4 text-sm text-gray-500">{u.adm}</td>

                      {/* Etapa */}
                      <td className="px-4 py-4 text-xs text-gray-600">{etapaAtualLabel(u.percentual)}</td>

                      {/* Progress */}
                      <td className="px-4 py-4"><ProgressBar value={u.percentual} /></td>

                      {/* Status */}
                      <td className="px-4 py-4"><StatusBadge status={u.status} /></td>

                      {/* Fotos */}
                      <td
                        className="px-4 py-4 text-right"
                        onClick={(e) => { e.stopPropagation(); window.open(u.driveUrl || DRIVE_FOTOS_URL, "_blank"); }}
                      >
                        <button className="inline-flex items-center gap-1.5 text-[#1CA095] text-xs font-semibold hover:text-[#178476] transition-colors">
                          <Camera className="h-3.5 w-3.5" />
                          Fotos
                        </button>
                      </td>
                    </tr>

                    {/* ── Linha expandida — Stepper ── */}
                    {isOpen && (
                      <tr className="bg-[#f8f9fb] border-b border-gray-100">
                        <td colSpan={9} className="px-8 py-6">
                          <div className="w-full overflow-x-auto whitespace-nowrap">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                Etapas da obra
                              </span>
                              <span className="ml-2 text-xs text-gray-400">
                                {u.empreendimento} · Unidade {u.unidade}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-[11px]">
                              <span className="flex items-center gap-1.5 text-emerald-600">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Finalizado
                              </span>
                              <span className="flex items-center gap-1.5 text-[#1a1f3c]">
                                <span className="h-2 w-2 rounded-full bg-[#1a1f3c]" /> Em andamento
                              </span>
                              <span className="flex items-center gap-1.5 text-gray-400">
                                <span className="h-2 w-2 rounded-full bg-gray-200" /> Não iniciado
                              </span>
                            </div>
                          </div>
                          <EtapasStepper percentual={u.percentual} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-sm text-gray-400">
                    Nenhuma unidade encontrada com os filtros selecionados.
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
