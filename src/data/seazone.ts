export type StatusObra = "Em Dia" | "Atenção Prazo" | "Atrasada" | "Concluída";
export type StatusEtapa = "Finalizado" | "Em Andamento" | "Não Iniciado";
export type StatusEntrega = "Entregue" | "Previsto" | "Pendente" | "Atrasado";

export interface Unidade {
  unidade: string;
  empreendimento: string;
  investidor: string;
  pacote: "Essential" | "Plus" | "Premium";
  adm: string;
  percentual: number;
  status: StatusObra;
  prazo: string;
  driveUrl?: string; // link para a pasta de fotos desta unidade no Drive
}

export const ETAPAS_PADRAO = [
  "Medição",
  "Ligação de energia",
  "Liberação chaves",
  "Instalação ar condicionado",
  "Instalação elétrica e luminárias",
  "Pintura 1 demão",
  "Marcenaria",
  "Marmoraria",
  "Instalação box",
  "Instalação hidráulicas e metais",
  "Pintura 2 demão",
  "Instalação eletros",
  "Decoração e mobiliário",
  "Limpeza",
  "Vistoria Decor",
  "Vistoria Implantação",
  "Ajustes pós obra",
];

export function etapaAtualLabel(percentual: number): string {
  if (percentual >= 100) return "Concluída";
  if (percentual >= 75) return "Instalação eletros / Decoração";
  if (percentual >= 65) return "Pintura 2 demão";
  if (percentual >= 30) return "Pintura 1 demão";
  return "Medição";
}

export function etapasParaUnidade(percentual: number): { nome: string; status: StatusEtapa }[] {
  return ETAPAS_PADRAO.map((nome, i) => {
    if (percentual >= 100) return { nome, status: "Finalizado" as StatusEtapa };
    if (percentual >= 75) {
      if (i < 11) return { nome, status: "Finalizado" as StatusEtapa };
      if (i < 13) return { nome, status: "Em Andamento" as StatusEtapa };
      return { nome, status: "Não Iniciado" as StatusEtapa };
    }
    if (percentual >= 65) {
      if (i < 9) return { nome, status: "Finalizado" as StatusEtapa };
      if (i < 11) return { nome, status: "Em Andamento" as StatusEtapa };
      return { nome, status: "Não Iniciado" as StatusEtapa };
    }
    if (percentual >= 30) {
      if (i < 5) return { nome, status: "Finalizado" as StatusEtapa };
      return { nome, status: "Não Iniciado" as StatusEtapa };
    }
    return { nome, status: "Não Iniciado" as StatusEtapa };
  });
}

export const UNIDADES: Unidade[] = [
  { unidade: "101", empreendimento: "Urubici Spot", investidor: "Marcia Marina Serpeloni Peteli", pacote: "Plus", adm: "MOG", percentual: 75, status: "Atenção Prazo", prazo: "60 dias" },
  { unidade: "205", empreendimento: "Urubici Spot", investidor: "Ewerton Luiz Schmitz", pacote: "Premium", adm: "MOG", percentual: 73, status: "Em Dia", prazo: "60 dias" },
  { unidade: "208", empreendimento: "Urubici Spot", investidor: "Alexandre Brito", pacote: "Plus", adm: "MOG", percentual: 75, status: "Em Dia", prazo: "60 dias" },
  { unidade: "210", empreendimento: "Urubici Spot", investidor: "Antonio Zata Borges", pacote: "Essential", adm: "MOG", percentual: 75, status: "Atenção Prazo", prazo: "60 dias" },
  { unidade: "303", empreendimento: "Urubici Spot", investidor: "J.A. Administradora de Bens", pacote: "Essential", adm: "MOG", percentual: 75, status: "Em Dia", prazo: "60 dias" },
  { unidade: "304", empreendimento: "Urubici Spot", investidor: "Fabiano Sellos Costa", pacote: "Essential", adm: "MOG", percentual: 75, status: "Em Dia", prazo: "60 dias" },
  { unidade: "309", empreendimento: "Urubici Spot", investidor: "Matheus Alberto Ambrosi", pacote: "Essential", adm: "MOG", percentual: 75, status: "Atenção Prazo", prazo: "60 dias" },
  { unidade: "311", empreendimento: "Urubici Spot", investidor: "Larissa Mendonca Thiegue", pacote: "Plus", adm: "MOG", percentual: 75, status: "Em Dia", prazo: "60 dias" },
  { unidade: "403", empreendimento: "Urubici Spot", investidor: "José Ricardo Momo", pacote: "Essential", adm: "MOG", percentual: 71, status: "Em Dia", prazo: "60 dias" },
  { unidade: "404", empreendimento: "Urubici Spot", investidor: "Keshers Empreendimentos", pacote: "Plus", adm: "MOG", percentual: 75, status: "Atenção Prazo", prazo: "60 dias" },
  { unidade: "408", empreendimento: "Urubici Spot", investidor: "Julio Pavei Furlanetto", pacote: "Essential", adm: "MOG", percentual: 75, status: "Em Dia", prazo: "60 dias" },
  { unidade: "409", empreendimento: "Urubici Spot", investidor: "Daniela Corrêa da Silva", pacote: "Essential", adm: "MOG", percentual: 75, status: "Atenção Prazo", prazo: "60 dias" },
  { unidade: "502", empreendimento: "Urubici Spot", investidor: "José Ricardo Momo", pacote: "Essential", adm: "MOG", percentual: 71, status: "Em Dia", prazo: "60 dias" },
  { unidade: "503", empreendimento: "Urubici Spot", investidor: "José Ricardo Momo", pacote: "Essential", adm: "MOG", percentual: 71, status: "Em Dia", prazo: "60 dias" },
  { unidade: "506", empreendimento: "Urubici Spot", investidor: "Cláudio Henrique Morais", pacote: "Plus", adm: "MOG", percentual: 75, status: "Atenção Prazo", prazo: "60 dias" },
  { unidade: "508", empreendimento: "Urubici Spot", investidor: "Jorge Henn", pacote: "Essential", adm: "MOG", percentual: 75, status: "Atenção Prazo", prazo: "60 dias" },
  { unidade: "510", empreendimento: "Urubici Spot", investidor: "Gabriel Marques Dabdab", pacote: "Essential", adm: "MOG", percentual: 75, status: "Em Dia", prazo: "60 dias" },
  { unidade: "911", empreendimento: "Penha Spot", investidor: "Lea Boiko Saltz", pacote: "Essential", adm: "MOG", percentual: 64, status: "Atenção Prazo", prazo: "60 dias" },
  { unidade: "109", empreendimento: "House Espatódeas", investidor: "Denivaldo Nascimento Almeida", pacote: "Premium", adm: "Venture", percentual: 100, status: "Concluída", prazo: "60 dias" },
  { unidade: "701", empreendimento: "House Espatódeas", investidor: "Denivaldo Nascimento Almeida", pacote: "Premium", adm: "Venture", percentual: 100, status: "Concluída", prazo: "60 dias" },
  { unidade: "509", empreendimento: "House Graça", investidor: "Talitha Santos Scavelo", pacote: "Essential", adm: "Venture", percentual: 68, status: "Atrasada", prazo: "60 dias" },
  { unidade: "415", empreendimento: "MOV Perdizes", investidor: "Ricardo Takao", pacote: "Essential", adm: "OES Construtora", percentual: 31, status: "Em Dia", prazo: "60 dias" },
];

export interface Compra {
  codigo: string;
  categoria?: string;
  produto: string;
  especificacoes: string;
  unidades: string;
  qtde: number;
  valorTotal: number;
  prazoEntrega: string;
  status: StatusEntrega;
  fornecedor: string;
  empreendimento: string;
}

export const COMPRAS: Compra[] = [
  { codigo: "C001", produto: "Ar Condicionado", especificacoes: "Midea 12.000 BTUs Q/F", unidades: "101,208,210,303,304,309,311,403,404,408,409,506,508", qtde: 13, valorTotal: 32734.25, prazoEntrega: "Entregue", status: "Entregue", fornecedor: "Midea Brasil", empreendimento: "Urubici Spot" },
  { codigo: "C002", produto: "Mármore", especificacoes: "Granito Pitaya Polido - Cozinha e banheiros", unidades: "Todas as unidades", qtde: 1, valorTotal: 33905.0, prazoEntrega: "18/05/2026", status: "Previsto", fornecedor: "Marmoraria Central", empreendimento: "Todos" },
  { codigo: "C003", produto: "TV", especificacoes: '43" LG', unidades: "101,208,210,303,304,309", qtde: 6, valorTotal: 9910.0, prazoEntrega: "02/05/2026", status: "Previsto", fornecedor: "LG Brasil", empreendimento: "Urubici Spot" },
  { codigo: "C004", produto: "TV", especificacoes: '43" LG', unidades: "311,408,409,506,510", qtde: 5, valorTotal: 8325.0, prazoEntrega: "02/05/2026", status: "Previsto", fornecedor: "LG Brasil", empreendimento: "Urubici Spot" },
  { codigo: "C005", produto: "TV", especificacoes: '50" LG', unidades: "205,404,508", qtde: 3, valorTotal: 6687.0, prazoEntrega: "02/05/2026", status: "Previsto", fornecedor: "LG Brasil", empreendimento: "Urubici Spot" },
  { codigo: "C006", produto: "Box", especificacoes: "Alumínio escovado - Kit reto", unidades: "Todas as unidades", qtde: 1, valorTotal: 21345.0, prazoEntrega: "15/05/2026", status: "Previsto", fornecedor: "Vidraçaria Box+", empreendimento: "Todos" },
  { codigo: "C007", produto: "Cortinas", especificacoes: "Linho off White e Blackout 100%", unidades: "Todas as unidades", qtde: 1, valorTotal: 13519.0, prazoEntrega: "20/05/2026", status: "Previsto", fornecedor: "Cortinas SP", empreendimento: "Todos" },
  { codigo: "C008", produto: "Sofá", especificacoes: "Ortobom Cinza", unidades: "101, 208", qtde: 2, valorTotal: 7998.0, prazoEntrega: "20/05/2026", status: "Previsto", fornecedor: "Ortobom", empreendimento: "Urubici Spot" },
  { codigo: "C009", produto: "Chuveiro", especificacoes: "Acqua Plus Cromado - Deca", unidades: "Todas (14 un)", qtde: 14, valorTotal: 6382.6, prazoEntrega: "Entregue", status: "Entregue", fornecedor: "Deca", empreendimento: "Todos" },
  { codigo: "C010", produto: "Depurador", especificacoes: "Fischer Slim Inox 60 cm", unidades: "9 unidades", qtde: 9, valorTotal: 7333.29, prazoEntrega: "Entregue", status: "Entregue", fornecedor: "Fischer", empreendimento: "Urubici Spot" },
  { codigo: "C011", produto: "Instalação Ar condicionado", especificacoes: "Serviço", unidades: "13 unidades", qtde: 13, valorTotal: 10827.9, prazoEntrega: "27/04/2026", status: "Entregue", fornecedor: "TecnoClima", empreendimento: "Urubici Spot" },
  { codigo: "C012", produto: "Pintura", especificacoes: "Lisa e cimento queimado", unidades: "Todas", qtde: 1, valorTotal: 4700.0, prazoEntrega: "24/04/2026", status: "Entregue", fornecedor: "Pinturas RJ", empreendimento: "Todos" },
  { codigo: "C013", produto: "Cooktop", especificacoes: "Fischer Elétrico 2 bocas", unidades: "14 unidades", qtde: 14, valorTotal: 14000.0, prazoEntrega: "08/05/2026", status: "Previsto", fornecedor: "Fischer", empreendimento: "Todos" },
  { codigo: "C014", produto: "Cuba de apoio", especificacoes: "Celite Redonda RO30", unidades: "8 unidades", qtde: 8, valorTotal: 1710.4, prazoEntrega: "Entregue", status: "Entregue", fornecedor: "Celite", empreendimento: "Todos" },
  { codigo: "C015", produto: "Kit de metais", especificacoes: "Net Deca Cromado", unidades: "8 unidades", qtde: 8, valorTotal: 1784.8, prazoEntrega: "Entregue", status: "Entregue", fornecedor: "Deca", empreendimento: "Todos" },
  { codigo: "C016", produto: "Almofadas Personalizadas", especificacoes: "—", unidades: "13 unidades", qtde: 13, valorTotal: 299.4, prazoEntrega: "Entregue", status: "Entregue", fornecedor: "Decor Studio", empreendimento: "Urubici Spot" },
  { codigo: "C017", produto: "Luminárias Personalizadas", especificacoes: "—", unidades: "12 unidades", qtde: 12, valorTotal: 642.5, prazoEntrega: "Entregue", status: "Entregue", fornecedor: "LumiArt", empreendimento: "Urubici Spot" },
  { codigo: "C018", produto: "Toalheiro Térmico", especificacoes: "Aiuli Lado Direito Cromado", unidades: "101,205,404,304,506", qtde: 5, valorTotal: 2533.5, prazoEntrega: "06/05/2026", status: "Previsto", fornecedor: "Aiuli", empreendimento: "Urubici Spot" },
  { codigo: "C019", produto: "Cadeira", especificacoes: "Mila Couríssimo Whisky/Gengibre", unidades: "14 unidades", qtde: 14, valorTotal: 5389.3, prazoEntrega: "Entregue", status: "Entregue", fornecedor: "Móveis Mila", empreendimento: "Urubici Spot" },
];

export const EMPREENDIMENTOS = ["Urubici Spot", "Penha Spot", "House Espatódeas", "House Graça", "MOV Perdizes"];
export const ADMS = ["MOG", "Venture", "OES Construtora"];

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Slug helpers — usados para navegação até a página de detalhe da unidade
export function unidadeSlug(u: { empreendimento: string; unidade: string }): string {
  const norm = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${norm(u.empreendimento)}-${norm(u.unidade)}`;
}

export function unidadeBySlug(slug: string): Unidade | undefined {
  return UNIDADES.find((u) => unidadeSlug(u) === slug);
}

// Pacotes — escopo entregue por pacote
export const PACOTES: Record<Unidade["pacote"], { descricao: string; itens: string[] }> = {
  Essential: {
    descricao: "Pacote base com mobiliário essencial e acabamento padrão Seazone.",
    itens: [
      "Pintura completa (2 demãos)",
      "Mobiliário básico (sala, quarto, cozinha)",
      "Eletrodomésticos essenciais",
      "Cortinas blackout e linho",
      "Iluminação padrão",
    ],
  },
  Plus: {
    descricao: "Pacote intermediário com upgrades em mobiliário e decoração.",
    itens: [
      "Tudo do pacote Essential",
      "Mobiliário upgrade (sofá premium, mesa de jantar)",
      "Decoração temática",
      "Almofadas e quadros personalizados",
      "Iluminação decorativa",
    ],
  },
  Premium: {
    descricao: "Pacote completo com curadoria de design e mobiliário premium.",
    itens: [
      "Tudo do pacote Plus",
      "Marcenaria sob medida",
      "Eletrodomésticos premium",
      "Mármores e metais nobres",
      "Curadoria de decoração assinada",
      "Vistoria técnica reforçada",
    ],
  },
};

// Personalização — escolhas do investidor
export interface Personalizacao {
  paletaCores: string;
  estilo: string;
  observacoes: string;
  itensExtras: string[];
}

export function personalizacaoUnidade(u: Unidade): Personalizacao {
  // Personalização inferida do pacote
  if (u.pacote === "Premium") {
    return {
      paletaCores: "Tons terrosos · Off-white · Detalhes em coral",
      estilo: "Contemporâneo aconchegante",
      observacoes: "Investidor solicitou acabamentos premium em todos os ambientes.",
      itensExtras: ["Cabeceira estofada sob medida", "Tapete persa sala", "Quadros autorais"],
    };
  }
  if (u.pacote === "Plus") {
    return {
      paletaCores: "Off-white · Slate · Detalhes em peach",
      estilo: "Moderno minimalista",
      observacoes: "Decoração com toques personalizados na sala e quarto principal.",
      itensExtras: ["Almofadas estampadas", "Luminária pendente cozinha"],
    };
  }
  return {
    paletaCores: "Off-white · Slate",
    estilo: "Essencial Seazone",
    observacoes: "Pacote padrão sem personalização adicional contratada.",
    itensExtras: [],
  };
}

// Tarefas operacionais paralelas às etapas
export interface Tarefa { titulo: string; responsavel: string; progresso: number; status: StatusEtapa; }

export function tarefasUnidade(u: Unidade): Tarefa[] {
  const p = u.percentual;
  const f = (n: number): StatusEtapa => (n >= 100 ? "Finalizado" : n > 0 ? "Em Andamento" : "Não Iniciado");
  const t = (base: number) => Math.min(100, Math.max(0, Math.round(p + base)));
  return [
    { titulo: "Aprovação de projeto", responsavel: "Equipe Decor", progresso: 100, status: "Finalizado" },
    { titulo: "Pedido de compras", responsavel: u.adm, progresso: t(15), status: f(t(15)) },
    { titulo: "Execução em obra", responsavel: u.adm, progresso: p, status: f(p) },
    { titulo: "Vistoria interna", responsavel: "Equipe Decor", progresso: t(-25), status: f(t(-25)) },
    { titulo: "Entrega final ao investidor", responsavel: "Anna", progresso: t(-40), status: f(t(-40)) },
  ];
}

// Fotos de obra (URLs externas usadas apenas como ilustração interna)
export const FOTOS_OBRA: { url: string; legenda: string }[] = [
  { url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=60", legenda: "Sala — pintura 2ª demão" },
  { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=60", legenda: "Cozinha — marmoraria instalada" },
  { url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=60", legenda: "Quarto — decoração e mobiliário" },
  { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=60", legenda: "Banheiro — metais Deca" },
  { url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=60", legenda: "Vista geral pós-limpeza" },
  { url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=60", legenda: "Detalhe — luminárias" },
];

// Compras filtradas para uma unidade
export function comprasDaUnidade(u: Unidade): Compra[] {
  return COMPRAS.filter((c) => {
    if (c.empreendimento !== "Todos" && c.empreendimento !== u.empreendimento) return false;
    const lista = c.unidades.toLowerCase();
    if (lista.includes("todas")) return true;
    return lista.split(/[\s,]+/).some((x) => x === u.unidade);
  });
}