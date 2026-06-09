import { useState } from "react";

import { useAIAnalysis, useAIChat, UnitData } from "@/hooks/useAIAnalysis";



const RISK_COLORS = {

  Alto:  { bg: "bg-red-50",    text: "text-red-700",    border: "border-l-red-500"    },

  Médio: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-l-yellow-500" },

  Baixo: { bg: "bg-green-50",  text: "text-green-700",  border: "border-l-green-500"  },

};

const PRIO_COLORS = {

  Urgente:    { bg: "bg-red-100",    text: "text-red-700"    },

  Importante: { bg: "bg-yellow-100", text: "text-yellow-700" },

  Sugestão:   { bg: "bg-green-100",  text: "text-green-700"  },

};



interface Props { units: UnitData[]; }

type Tab = "risco" | "recomendacoes" | "memorial" | "chat";



export function AIAgentPanel({ units }: Props) {

  const [activeTab, setActiveTab] = useState<Tab>("risco");

  const [chatInput, setChatInput] = useState("");

  const { analysis, loading, error, refresh } = useAIAnalysis(units);

  const { messages, thinking, send } = useAIChat(units);



  const tabs: { key: Tab; label: string }[] = [

    { key: "risco",         label: "🎯 Risco & Previsão" },

    { key: "recomendacoes", label: "💡 Recomendações" },

    { key: "memorial",      label: "📋 Memorial vs Execução" },

    { key: "chat",          label: "💬 Assistente" },

  ];



  return (

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">

        <div className="flex items-center gap-2">

          <span className="font-semibold text-sm text-gray-800">🤖 Agente IA · Obras Decor</span>

          <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">IA</span>

        </div>

        <div className="flex items-center gap-2">

          {loading && <span className="text-xs text-gray-400 animate-pulse">Analisando...</span>}

          {error  && <span className="text-xs text-red-500">{error}</span>}

          <button onClick={refresh} className="text-xs text-blue-600 hover:underline" disabled={loading}>Atualizar</button>

        </div>

      </div>



      <div className="flex border-b border-gray-100 px-4 gap-1">

        {tabs.map(t => (

          <button key={t.key} onClick={() => setActiveTab(t.key)}

            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === t.key ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>

            {t.label}

          </button>

        ))}

      </div>



      <div className="p-4">

        {activeTab === "risco" && (

          <div>

            {loading && <div className="text-center py-10 text-gray-400 text-sm">Calculando riscos com IA...</div>}

            {!loading && !analysis && <div className="text-center py-10 text-gray-400 text-sm">Nenhuma análise disponível.</div>}

            {analysis && (

              <>

                {analysis.resumo && (

                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 leading-relaxed">

                    <span className="font-bold uppercase text-[10px] tracking-wide text-blue-500 block mb-1">Resumo Executivo</span>

                    {analysis.resumo}

                  </div>

                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

                  {analysis.analise.map((a, i) => {

                    const colors = RISK_COLORS[a.risco] || RISK_COLORS.Baixo;

                    return (

                      <div key={i} className={`rounded-lg border border-gray-200 border-l-4 ${colors.border} p-3`}>

                        <div className="flex justify-between items-start mb-2">

                          <div className="font-semibold text-xs text-gray-800">{a.emp} · Und. {a.und}</div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors.bg} ${colors.text}`}>{a.risco}</span>

                        </div>

                        <div className="text-xs text-gray-500 mb-1"><span className="font-semibold text-gray-700">Gargalo:</span> {a.gargalo}</div>

                        {a.previsao && <div className="text-[10px] text-gray-400 mb-2">Previsão: {a.previsao}</div>}

                        <div className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 leading-relaxed">→ {a.acao}</div>

                      </div>

                    );

                  })}

                </div>

              </>

            )}

          </div>

        )}



        {activeTab === "recomendacoes" && (

          <div>

            {loading && <div className="text-center py-10 text-gray-400 text-sm">Gerando recomendações...</div>}

            {analysis?.recomendacoes && (

              <div className="space-y-3">

                {analysis.recomendacoes.map((r, i) => {

                  const colors = PRIO_COLORS[r.prio] || PRIO_COLORS.Sugestão;

                  return (

                    <div key={i} className="flex gap-3 p-3 border border-gray-200 rounded-lg">

                      <span className="text-lg flex-shrink-0">{r.icone}</span>

                      <div className="flex-1">

                        <div className="flex items-center gap-2 mb-1">

                          <span className="font-semibold text-xs text-gray-800">{r.titulo}</span>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors.bg} ${colors.text}`}>{r.prio}</span>

                        </div>

                        <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>

                        {r.impacto && <p className="text-[11px] text-blue-600 mt-1">→ {r.impacto}</p>}

                      </div>

                    </div>

                  );

                })}

              </div>

            )}

          </div>

        )}



        {activeTab === "memorial" && (

          <div>

            {loading && <div className="text-center py-10 text-gray-400 text-sm">Analisando memorial...</div>}

            {analysis?.memorial && (

              <div className="space-y-3">

                {analysis.memorial.map((m, i) => (

                  <div key={i} className="border border-gray-200 rounded-lg p-3">

                    <div className="flex justify-between items-start mb-2">

                      <div>

                        <div className="font-semibold text-xs text-gray-800">{m.emp} · Und. {m.und}</div>

                        <div className="text-[11px] text-gray-400">{m.pacote}</div>

                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.status === "Conforme" ? "bg-green-100 text-green-700" : m.status === "Divergência" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{m.status}</span>

                    </div>

                    {m.ok?.length > 0 && m.ok.map((item, j) => (

                      <div key={j} className="flex gap-2 text-xs text-gray-500 py-0.5"><span className="text-green-600">✓</span>{item}</div>

                    ))}

                    {m.atencao?.length > 0 && (

                      <div className="mt-2">

                        <div className="text-[10px] font-bold text-yellow-700 uppercase tracking-wide mb-1">Atenção</div>

                        {m.atencao.map((item, j) => (

                          <div key={j} className="flex gap-2 text-xs text-yellow-700 py-0.5"><span>!</span>{item}</div>

                        ))}

                      </div>

                    )}

                  </div>

                ))}

              </div>

            )}

          </div>

        )}



        {activeTab === "chat" && (

          <div className="flex flex-col gap-3" style={{ minHeight: 320 }}>

            <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-72 pr-1">

              {messages.length === 0 && <div className="text-xs text-gray-400 italic text-center py-4">Pergunte sobre riscos, gargalos ou reordenação de etapas</div>}

              {messages.map((m, i) => (

                <div key={i} className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${m.role === "user" ? "bg-blue-600 text-white self-end rounded-br-sm" : "bg-gray-100 text-gray-800 self-start rounded-bl-sm"}`} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start" }}>

                  {m.text}

                </div>

              ))}

              {thinking && <div className="text-xs text-gray-400 self-start bg-gray-100 px-3 py-2 rounded-lg animate-pulse">Analisando...</div>}

            </div>

            <div className="flex gap-2">

              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}

                onKeyDown={e => { if (e.key === "Enter" && chatInput.trim()) { send(chatInput.trim()); setChatInput(""); } }}

                placeholder="Pergunte sobre as obras..."

                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400" />

              <button onClick={() => { if (chatInput.trim()) { send(chatInput.trim()); setChatInput(""); } }}

                disabled={thinking || !chatInput.trim()}

                className="px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">

                Enviar

              </button>

            </div>

          </div>

        )}

      </div>

    </div>

  );

}