import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useSheetData } from "@/hooks/useSheetData";
import { EMPREENDIMENTOS, ADMS } from "@/data/seazone";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FolderOpen, Camera, Upload, Lock, LogOut } from "lucide-react";

const DRIVE_ROOT = "https://drive.google.com/drive/folders/1U0PxtQeuURhOY-aFoD0TZvh8WwSkGs61";

const ADM_SESSION_KEY = "sz_adm_logged";

function normalize(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Senha aceita: "{nomeAdm}adm" (case insensitive, ignora acentos/espaços). */
function matchAdmPassword(password: string): string | null {
  const p = normalize(password);
  for (const adm of ADMS) {
    const expected = normalize(adm) + "adm";
    if (p === expected) return adm;
  }
  return null;
}

export const Route = createFileRoute("/adm")({
  head: () => ({
    meta: [
      { title: "Área do ADM — Seazone Decor" },
      { name: "description", content: "Portal de registro fotográfico semanal das obras." },
    ],
  }),
  component: AdmGate,
});

function AdmGate() {
  const [admLogado, setAdmLogado] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(ADM_SESSION_KEY);
      if (saved) setAdmLogado(saved);
    } catch {/* noop */}
  }, []);

  if (!admLogado) {
    return <AdmLogin onSuccess={(adm) => {
      try { sessionStorage.setItem(ADM_SESSION_KEY, adm); } catch {/* noop */}
      setAdmLogado(adm);
    }} />;
  }

  return <AdmPage admLogado={admLogado} onLogout={() => {
    try { sessionStorage.removeItem(ADM_SESSION_KEY); } catch {/* noop */}
    setAdmLogado(null);
  }} />;
}

function AdmLogin({ onSuccess }: { onSuccess: (adm: string) => void }) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const adm = matchAdmPassword(pwd);
    if (!adm) {
      setErr("Senha inválida. Use o formato: nomedaadministradoraadm");
      return;
    }
    onSuccess(adm);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F3F4] p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-black/5 p-8"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-[#171E37] flex items-center justify-center mb-3">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-[#171E37]">Área do ADM</h1>
          <p className="text-xs text-gray-500 mt-1">Acesso restrito à administradora</p>
        </div>

        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Senha de acesso
        </label>
        <Input
          type="password"
          autoFocus
          value={pwd}
          onChange={(e) => { setPwd(e.target.value); setErr(null); }}
          placeholder="ex: mogadm"
          className="mt-2 rounded-xl border-gray-200"
        />
        {err && (
          <p className="text-xs text-red-600 mt-2">{err}</p>
        )}

        <button
          type="submit"
          className="mt-5 w-full rounded-xl bg-[#171E37] text-white text-sm font-semibold py-3 hover:bg-[#0f1428] transition-colors"
        >
          Entrar
        </button>

        <p className="text-[11px] text-gray-400 text-center mt-5 leading-relaxed">
          Formato da senha: <span className="font-mono text-gray-600">[administradora]adm</span>
        </p>
      </form>
    </div>
  );
}

function AdmPage({ admLogado, onLogout }: { admLogado: string; onLogout: () => void }) {
  const { unidades } = useSheetData();
  const [empFilter, setEmpFilter] = useState("todos");

  const filtered = useMemo(
    () =>
      unidades.filter(
        (u) =>
          u.status !== "Concluída" &&
          u.adm === admLogado &&
          (empFilter === "todos" || u.empreendimento === empFilter),
      ),
    [unidades, empFilter, admLogado],
  );

  return (
    <AppShell
      title="Área do ADM"
      subtitle={`Administradora ${admLogado} · ${filtered.length} unidade${filtered.length !== 1 ? "s" : ""} em obra`}
    >
      {/* Sessão logada */}
      <div className="flex items-center justify-between mb-5">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 bg-white border border-black/5 rounded-full px-3 py-1.5">
          <Lock className="h-3.5 w-3.5 text-[#1CA095]" />
          Logado como <span className="text-[#171E37] font-semibold">{admLogado}</span>
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#171E37] transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </div>

      {/* Instrução */}
      <div className="bg-[#171E37] rounded-2xl p-6 mb-6 text-white">
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
          const inputId = `upload-${u.empreendimento}-${u.unidade}`.replace(/\s+/g, "-");
          return (
            <div
              key={u.empreendimento + u.unidade}
              className="bg-white rounded-2xl p-5 shadow-sm border border-black/5 flex flex-col gap-3"
            >
              {/* Cabeçalho */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-[#171E37] text-base leading-tight">
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
                  className="h-full rounded-full bg-[#171E37]/40"
                  style={{ width: `${u.percentual}%` }}
                />
              </div>

              {/* Botão Tirar foto (abre câmera no mobile) */}
              <label
                htmlFor={inputId}
                className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-[#1CA095] text-white text-sm font-semibold py-3.5 hover:bg-[#178476] transition-colors cursor-pointer active:scale-[0.98]"
              >
                <Camera className="h-4 w-4" />
                Tirar foto agora
              </label>
              <input
                id={inputId}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    // Após selecionar/capturar, abre a pasta no Drive para upload manual
                    window.open(driveUrl, "_blank");
                  }
                }}
              />

              {/* Abrir pasta no Drive */}
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-[#171E37]/15 text-[#171E37] text-sm font-semibold py-2.5 hover:bg-[#171E37]/5 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Abrir pasta no Drive
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
