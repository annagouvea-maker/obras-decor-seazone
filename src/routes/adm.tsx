import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useSheetData } from "@/hooks/useSheetData";
import { EMPREENDIMENTOS } from "@/data/seazone";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FolderOpen, Camera, Upload } from "lucide-react";

const DRIVE_ROOT = "https://drive.google.com/drive/folders/1U0PxtQeuURhOY-aFoD0TZvh8WwSkGs61";

export const Route = createFileRoute("/adm")({
  head: () => ({
    meta: [
      { title: "Área do ADM — Seazone Decor" },
      { name: "description", content: "Portal de registro fotográfico semanal das obras." },
    ],
  }),
  component: AdmPage,
});

function AdmPage() {
  const { unidades } = useSheetData();
  const [empFilter, setEmpFilter] = useState("todos");

  const filtered = useMemo(
    () =>
      unidades.filter(
        (u) =>
          u.status !== "Concluída" &&
          (empFilter === "todos" || u.empreendimento === empFilter),
      ),
    [unidades, empFilter],
  );

  return (
    <AppShell
      title="Área do ADM"
      subtitle="Registro fotográfico semanal das unidades em obra"
    >
      {/* Instrução */}
      <div className="bg-[#00153e] rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Camera className="h-5 w-5 text-[#fc605b]" />
          </div>
          <div>
            <h2 className="font-semibold text-base mb-1">Como registrar as fotos semanais</h2>
            <ol className="text-sm text-white/70 space-y-1 list-decimal list-inside">
              <li>Encontre sua unidade abaixo e toque em <strong className="text-white">Abrir pasta</strong></li>
              <li>No Google Drive, crie uma subpasta com a data (ex: <span className="font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded">27-05-2025</span>)</li>
              <li>Faça o upload das fotos diretamente pelo celular</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Filtro */}
      <div className="mb-5">
        <Select value={empFilter} onValueChange={setEmpFilter}>
          <SelectTrigger className="w-64 bg-white rounded-xl border-black/10">
            <SelectValue placeholder="Todos os empreendimentos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os empreendimentos</SelectItem>
            {EMPREENDIMENTOS.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards de unidades */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((u) => {
          const driveUrl = u.driveUrl || DRIVE_ROOT;
          return (
            <div
              key={u.empreendimento + u.unidade}
              className="bg-white rounded-2xl p-5 shadow-sm border border-black/5 flex flex-col gap-3"
            >
              {/* Cabeçalho */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-[#00153e] text-base leading-tight">
                    {u.unidade}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{u.empreendimento}</div>
                </div>
                <span className="text-xs font-semibold tabular-nums text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                  {u.percentual}%
                </span>
              </div>

              {/* Barra de progresso */}
              <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#00153e]/40"
                  style={{ width: `${u.percentual}%` }}
                />
              </div>

              {/* ADM */}
              <div className="text-xs text-gray-400">
                ADM: <span className="text-gray-700 font-medium">{u.adm}</span>
              </div>

              {/* Botão de upload */}
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-[#fc605b] text-white text-sm font-semibold py-2.5 hover:bg-[#e5544f] transition-colors"
              >
                <Upload className="h-4 w-4" />
                Abrir pasta
              </a>

              {/* Link secundário */}
              {u.driveUrl && (
                <a
                  href={u.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  Pasta da unidade
                </a>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-sm text-gray-400">
            Nenhuma unidade em obra encontrada.
          </div>
        )}
      </div>
    </AppShell>
  );
}
