import { useState, useEffect, useCallback } from "react";

import { supabase } from "@/integrations/supabase/client";



export interface UnitData {
  emp: string;
  und: string;
  adm: string;
  pacote: string;
  pers: boolean;
  pct: number;
  prazo: string;
  alertas?: string[];
  memorialObs?: string;
  pendentes: {
    nome: string;
    status: string;
    pct: number;
    prevFim?: string;
    inicioReal?: string;
    obs?: string;
  }[];
}



export interface AIAnalysis {
  resumo: string;
  analise: {
    emp: string;
    und: string;
    risco: "Alto" | "Médio" | "Baixo";
    gargalo: string;
    acao: string;
    previsao: string | null;
    memorial_flag: string | null;
  }[];
  recomendacoes: {
    prio: "Urgente" | "Importante" | "Sugestão";
    icone: string;
    titulo: string;
    desc: string;
    impacto: string;
  }[];
  memorial: {
    emp: string;
    und: string;
    pacote: string;
    status: "Conforme" | "Divergência" | "Atenção";
    ok: string[];
    atencao: string[];
  }[];
}



export function useAIAnalysis(units: UnitData[]) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!units.length) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-obras", {
        body: { units, today: new Date().toLocaleDateString("pt-BR") },
      });
      if (fnError) throw fnError;
      setAnalysis(data as AIAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro na análise IA");
    } finally {
      setLoading(false);
    }
  }, [units]);

  useEffect(() => { runAnalysis(); }, []);

  return { analysis, loading, error, refresh: runAnalysis };
}



export function useAIChat(units: UnitData[]) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [thinking, setThinking] = useState(false);

  const send = useCallback(async (question: string) => {
    setMessages(prev => [...prev, { role: "user", text: question }]);
    setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-obras", {
        body: { units, question, today: new Date().toLocaleDateString("pt-BR") },
      });
      if (error) throw error;
      setMessages(prev => [...prev, { role: "ai", text: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: "Erro: " + (err instanceof Error ? err.message : "tente novamente") }]);
    } finally {
      setThinking(false);
    }
  }, [units]);

  return { messages, thinking, send };
}
