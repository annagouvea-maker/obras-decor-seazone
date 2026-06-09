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
    obs?: string;
  }[];
}

export interface RiskUnit {
  und: string;
  emp: string;
  risk: "Alto" | "Médio" | "Baixo";
  reason: string;
  prediction: string;
  daysToDeadline?: number;
}

export interface Recommendation {
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  units: string[];
}

export interface MemorialDivergence {
  und: string;
  emp: string;
  issue: string;
}

export interface AIAnalysis {
  risks: RiskUnit[];
  recommendations: Recommendation[];
  memorialDivergences: MemorialDivergence[];
  summary: string;
  generatedAt: string;
  mode: "ai" | "local";
}

function analyzeLocally(units: UnitData[]): AIAnalysis {
  const today = new Date();

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    return new Date(+parts[2], +parts[1] - 1, +parts[0]);
  };

  const getDays = (prazo: string): number | null => {
    const d = parseDate(prazo);
    if (!d) return null;
    return Math.ceil((d.getTime() - today.getTime()) / 86400000);
  };

  const risks: RiskUnit[] = units.map((u) => {
    const days = getDays(u.prazo);
    const hasAlerts = (u.alertas?.length ?? 0) > 0;
    const hasCritical = u.pendentes?.some((p) => p.status === "Atrasado" || p.pct < 30);

    let risk: "Alto" | "Médio" | "Baixo" = "Baixo";
    let reason = "Obra dentro do cronograma.";
    let prediction = "Entrega no prazo previsto.";

    if (days !== null && days < 0) {
      risk = "Alto";
      reason = `Prazo vencido há ${Math.abs(days)} dias.${hasAlerts ? " Alertas registrados." : ""}`;
      prediction = `Atraso de ~${Math.abs(days) + 15} dias projetado.`;
    } else if (days !== null && days < 30 && u.pct < 80) {
      risk = "Alto";
      reason = `${days} dias para entrega com ${u.pct}% concluído.`;
      prediction = "Risco alto de não entrega. Aceleração necessária.";
    } else if (hasCritical || hasAlerts) {
      risk = "Médio";
      reason = `Etapas com atraso detectadas. ${u.alertas?.[0] ?? ""}`;
      prediction = "Monitorar. Possível atraso de 1-2 semanas.";
    } else if (days !== null && days < 60 && u.pct < 60) {
      risk = "Médio";
      reason = "Ritmo atual pode não ser suficiente para o prazo.";
      prediction = "Necessário acelerar 15% nas próximas 2 semanas.";
    } else if (u.pct >= 90) {
      reason = `${u.pct}% concluído, na reta final.`;
      prediction = "Entrega prevista no prazo.";
    }

    return { und: u.und, emp: u.emp, risk, reason, prediction, daysToDeadline: days ?? undefined };
  });

  const recommendations: Recommendation[] = [];
  const high = risks.filter((r) => r.risk === "Alto");
  const med = risks.filter((r) => r.risk === "Médio");

  if (high.length > 0) {
    recommendations.push({
      type: "critical",
      title: `${high.length} obra${high.length > 1 ? "s" : ""} em risco crítico`,
      description: "Intervenção imediata. Acionar ADM e fornecedores para plano de recuperação.",
      units: high.map((r) => r.und),
    });
  }

  if (med.length > 0) {
    recommendations.push({
      type: "warning",
      title: `${med.length} obra${med.length > 1 ? "s precisam" : " precisa"} de atenção`,
      description: "Monitoramento intensificado. Verificar etapas pendentes semanalmente.",
      units: med.map((r) => r.und),
    });
  }

  const persClose = units.filter((u) => {
    const d = getDays(u.prazo);
    return u.pers && d !== null && d < 45;
  });
  if (persClose.length > 0) {
    recommendations.push({
      type: "warning",
      title: "Personalizações com prazo apertado",
      description: "Confirmar escolhas do investidor com urgência.",
      units: persClose.map((u) => u.und),
    });
  }

  const memorialDivergences: MemorialDivergence[] = units
    .filter((u) => u.memorialObs && u.memorialObs.length > 0)
    .map((u) => ({ und: u.und, emp: u.emp, issue: u.memorialObs! }));

  const avgPct = Math.round(units.reduce((acc, u) => acc + u.pct, 0) / units.length);
  const summary = `${units.length} unidades. Progresso médio: ${avgPct}%. ${high.length} risco alto, ${med.length} atenção. ${memorialDivergences.length > 0 ? `${memorialDivergences.length} divergências no memorial.` : "Memorial ok."}`;

  return {
    risks,
    recommendations,
    memorialDivergences,
    summary,
    generatedAt: new Date().toLocaleString("pt-BR"),
    mode: "local",
  };
}

export function useAIAnalysis(units: UnitData[]) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!units || units.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-obras", {
        body: { units, today: new Date().toLocaleDateString("pt-BR") },
      });
      if (fnError || !data) throw new Error("Edge Function indisponível");
      setAnalysis({ ...(data as AIAnalysis), mode: "ai" });
    } catch {
      setAnalysis(analyzeLocally(units));
    } finally {
      setLoading(false);
    }
  }, [units]);

  useEffect(() => { runAnalysis(); }, []);

  return { analysis, loading, error, refresh: runAnalysis };
}

export function useAIChat(units: UnitData[]) {
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(
    async (message: string) => {
      setLoading(true);
      const newHistory = [...chatHistory, { role: "user", content: message }];
      setChatHistory(newHistory);
      try {
        const { data, error: fnError } = await supabase.functions.invoke("ai-obras", {
          body: { units, message, history: chatHistory },
        });
        if (fnError || !data?.answer) throw new Error("IA indisponível");
        setChatHistory([...newHistory, { role: "assistant", content: data.answer }]);
      } catch {
        const local = analyzeLocally(units);
        const highUnits = local.risks.filter((r) => r.risk === "Alto").map((r) => r.und).join(", ");
        const answer = message.toLowerCase().includes("risco")
          ? `Risco alto: ${highUnits || "nenhuma unidade"}. ${local.summary}`
          : message.toLowerCase().includes("recomend")
          ? local.recommendations.map((r) => `• ${r.title}: ${r.description}`).join("\n")
          : `Análise local: ${local.summary}`;
        setChatHistory([...newHistory, { role: "assistant", content: answer }]);
      } finally {
        setLoading(false);
      }
    },
    [units, chatHistory]
  );

  return { chatHistory, loading, sendMessage };
               }
