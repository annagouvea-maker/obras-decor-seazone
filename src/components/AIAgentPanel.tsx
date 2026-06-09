import { useState } from "react";
import { useAIAnalysis, useAIChat, UnitData } from "@/hooks/useAIAnalysis";

const RISK_COLORS = {
  Alto:  { bg: "bg-red-50",    text: "text-red-700",    border: "border-l-red-500"    },
  Médio: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-l-yellow-500" },
  Baixo: { bg: "bg-green-50",  text: "text-green-700",  border: "border-l-green-500"  },
};

interface Props {
  units: UnitData[];
}

export default function AIAgentPanel({ units }: Props) {
  const [tab, setTab] = useState<"risco" | "rec" | "memorial" | "chat">("risco");
  const { analysis, loading, refresh } = useAIAnalysis(units);
  const { chatHistory, loading: chatLoading, sendMessage } = useAIChat(units);
  const [msg, setMsg] = useState("");

  const risks = analysis?.risks ?? [];
  const recs = analysis?.recommendations ?? [];
  const divergences = analysis?.memorialDivergences ?? [];

  const handleSend = () => {
    if (!msg.trim()) return;
    sendMessage(msg);
    setMsg("");
  };

  const tabs = [
    { id: "risco",    label: "🎯 Risco & Previsão" },
    { id: "rec",      label: "💡 Recomendações"     },
    { id: "memorial", label: "📋 Memorial vs Execução" },
    { id: "chat",     label: "💬 Assistente"        },
  ] as const;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div>
          <h2 className="font-semibold text-sm">🤖 Agente IA — Gestão de Obras</h2>
          {analysis && (
            <p className="text-xs text-purple-200 mt-0.5">
              {analysis.mode === "ai" ? "✨ Análise Claude" : "⚡ Análise local"} • {analysis.generatedAt}
            </p>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition"
        >
          {loading ? "Analisando..." : "↻ Atualizar"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 text-xs py-2 px-1 font-medium transition ${
              tab === t.id
                ? "border-b-2 border-purple-600 text-purple-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            <div className="text-center">
              <div className="animate-spin text-2xl mb-2">⚙️</div>
              <p>Analisando obras...</p>
            </div>
          </div>
        )}

        {!loading && tab === "risco" && (
          <div className="space-y-3">
            {analysis && (
              <p className="text-xs text-gray-500 mb-3 bg-gray-50 p-2 rounded">{analysis.summary}</p>
            )}
            {risks.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Nenhum dado de risco disponível.</p>
            )}
            {risks.map((r) => {
              const colors = RISK_COLORS[r.risk] ?? RISK_COLORS["Baixo"];
              return (
                <div key={r.und} className={`border-l-4 ${colors.border} ${colors.bg} p-3 rounded-r-lg`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-gray-800">{r.und}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.text} bg-white border`}>
                      {r.risk}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{r.reason}</p>
                  <p className={`text-xs mt-1 font-medium ${colors.text}`}>→ {r.prediction}</p>
                  {r.daysToDeadline !== undefined && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.daysToDeadline < 0
                        ? `Atrasado ${Math.abs(r.daysToDeadline)} dias`
                        : `${r.daysToDeadline} dias para entrega`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && tab === "rec" && (
          <div className="space-y-3">
            {recs.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Nenhuma recomendação pendente.</p>
            )}
            {recs.map((rec, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  rec.type === "critical"
                    ? "bg-red-50 border-red-200"
                    : rec.type === "warning"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <p className="text-sm font-semibold text-gray-800">{rec.title}</p>
                <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                {(rec.units ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(rec.units ?? []).map((u) => (
                      <span key={u} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-600">
                        {u}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "memorial" && (
          <div className="space-y-3">
            {divergences.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm text-gray-500">Memorial em conformidade com a execução.</p>
              </div>
            ) : (
              divergences.map((d, i) => (
                <div key={i} className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-gray-800">
                    {d.und} — {d.emp}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{d.issue}</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "chat" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-2 mb-3">
              {chatHistory.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">
                  Pergunte sobre as obras, prazos ou riscos...
                </p>
              )}
              {chatHistory.map((m, i) => (
                <div
                  key={i}
                  className={`text-xs p-2 rounded-lg max-w-[85%] ${
                    m.role === "user"
                      ? "ml-auto bg-purple-100 text-purple-900"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {chatLoading && (
                <div className="text-xs text-gray-400 italic">Analisando...</div>
              )}
            </div>
            <div className="flex gap-2 mt-auto">
              <input
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400"
                placeholder="Qual obra tem mais risco?"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={chatLoading || !msg.trim()}
                className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 disabled:opacity-50 transition"
              >
                Enviar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
                  }
