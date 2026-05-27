import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Fragment } from "react";
import { AppShell, StatusBadge, ProgressBar } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EMPREENDIMENTOS, ADMS, etapaAtualLabel, etapasParaUnidade, unidadeSlug } from "@/data/seazone";
import { useSheetData } from "@/hooks/useSheetData";
import { ChevronDown, ChevronRight, Search, Camera } from "lucide-react";

const DRIVE_FOTOS_URL = "https://drive.google.com/drive/folders/1U0PxtQeuURhOY-aFoD0TZvh8WwSkGs61";

export const Route = createFileRoute("/obras")({
  head: () => ({
    meta: [
      { title: "Obras — Seazone Decor" },
      { name: "description", content: "Listagem e acompanhamento de todas as unidades em obra." },
    ],
  }),
  component: ObrasPage,
});

function ObrasPage() {
  const [empFilter, setEmpFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [admFilter, setAdmFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const navigate = useNavigate();
  const { unidades } = useSheetData();

  const filtered = useMemo(() => {
    return unidades.filter((u) => {
      if (empFilter !== "todos" && u.empreendimento !== empFilter) return false;
      if (statusFilter !== "todos" && u.status !== statusFilter) return false;
      if (admFilter !== "todos" && u.adm !== admFilter) return false;
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
      <Card className="p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={empFilter} onValueChange={setEmpFilter}>
            <SelectTrigger><SelectValue placeholder="Empreendimento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os empreendimentos</SelectItem>
              {EMPREENDIMENTOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="Em Dia">Em Dia</SelectItem>
              <SelectItem value="Atenção Prazo">Atenção Prazo</SelectItem>
              <SelectItem value="Atrasada">Atrasada</SelectItem>
              <SelectItem value="Concluída">Concluída</SelectItem>
            </SelectContent>
          </Select>
          <Select value={admFilter} onValueChange={setAdmFilter}>
            <SelectTrigger><SelectValue placeholder="ADM" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as ADMs</SelectItem>
              {ADMS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar unidade, investidor..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-4 py-3 w-8"></th>
                <th className="text-left font-medium px-4 py-3">Unidade</th>
                <th className="text-left font-medium px-4 py-3">Empreendimento</th>
                <th className="text-left font-medium px-4 py-3">Investidor</th>
                <th className="text-left font-medium px-4 py-3">Pacote</th>
                <th className="text-left font-medium px-4 py-3">ADM</th>
                <th className="text-left font-medium px-4 py-3">Etapa Atual</th>
                <th className="text-left font-medium px-4 py-3">% Concluído</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-right font-medium px-4 py-3">Fotos / Registro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const id = u.empreendimento + u.unidade;
                const isOpen = expanded === id;
                return (
                  <Fragment key={id}>
                    <tr
                      className="border-t cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => navigate({ to: "/obras/$id", params: { id: unidadeSlug(u) } })}
                    >
                      <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); setExpanded(isOpen ? null : id); }}>
                        {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{u.unidade}</td>
                      <td className="px-4 py-3 text-foreground">{u.empreendimento}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.investidor}</td>
                      <td className="px-4 py-3"><span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{u.pacote}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{u.adm}</td>
                      <td className="px-4 py-3 text-foreground text-xs">{etapaAtualLabel(u.percentual)}</td>
                      <td className="px-4 py-3"><ProgressBar value={u.percentual} /></td>
                      <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(e) => { e.stopPropagation(); window.open(DRIVE_FOTOS_URL, "_blank"); }}
                      >
                        <span className="inline-flex items-center gap-1 text-primary text-xs font-medium cursor-pointer hover:underline">
                          Fotos <Camera className="h-3.5 w-3.5" />
                        </span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-muted/20 border-t">
                        <td colSpan={10} className="px-6 py-5">
                          <div className="font-semibold text-sm mb-3 text-foreground">Etapas da obra — {u.empreendimento} {u.unidade}</div>
                          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {etapasParaUnidade(u.percentual).map((e, i) => (
                              <li key={i} className="flex items-center justify-between gap-3 bg-background rounded-md border px-3 py-2">
                                <span className="text-sm text-foreground">
                                  <span className="text-muted-foreground tabular-nums mr-2">{String(i + 1).padStart(2, "0")}.</span>
                                  {e.nome}
                                </span>
                                <StatusBadge status={e.status} />
                              </li>
                            ))}
                          </ol>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
