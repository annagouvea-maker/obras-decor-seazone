import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell, StatusBadge, ProgressBar } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Unidade } from "@/data/seazone";
import {
  unidadeBySlug,
  etapasParaUnidade,
  PACOTES,
  personalizacaoUnidade,
  tarefasUnidade,
  FOTOS_OBRA,
  comprasDaUnidade,
  formatBRL,
} from "@/data/seazone";
import { ArrowLeft, Check, Package, Palette, ListChecks, Image as ImageIcon, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/obras/$id")({
  head: ({ params }) => {
    const u = unidadeBySlug(params.id);
    const titulo = u ? `${u.empreendimento} ${u.unidade}` : "Unidade";
    return {
      meta: [
        { title: `${titulo} — Seazone Decor` },
        { name: "description", content: `Detalhes da unidade ${titulo}.` },
      ],
    };
  },
  loader: ({ params }) => {
    const u = unidadeBySlug(params.id);
    if (!u) throw notFound();
    return { unidade: u };
  },
  notFoundComponent: () => (
    <AppShell title="Unidade não encontrada">
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">A unidade solicitada não existe.</p>
        <Link to="/obras" className="text-sm text-primary font-medium mt-3 inline-block">← Voltar para Obras</Link>
      </Card>
    </AppShell>
  ),
  errorComponent: ({ error, reset }) => (
    <AppShell title="Erro">
      <Card className="p-6">
        <p className="text-sm text-destructive">{error.message}</p>
        <button onClick={reset} className="text-sm text-primary mt-3">Tentar novamente</button>
      </Card>
    </AppShell>
  ),
  component: UnidadeDetalhe,
});

function UnidadeDetalhe() {
  const { unidade: u } = Route.useLoaderData() as { unidade: Unidade };
  const etapas = etapasParaUnidade(u.percentual);
  const pacote = PACOTES[u.pacote];
  const person = personalizacaoUnidade(u);
  const tarefas = tarefasUnidade(u);
  const compras = comprasDaUnidade(u);

  return (
    <AppShell title={`${u.empreendimento} · Unidade ${u.unidade}`} subtitle={u.investidor}>
      <Link to="/obras" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar para Obras
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground font-medium">Status</div>
          <div className="mt-2"><StatusBadge status={u.status} /></div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground font-medium">Avanço</div>
          <div className="mt-2"><ProgressBar value={u.percentual} /></div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground font-medium">Pacote</div>
          <div className="text-lg font-semibold mt-2 text-foreground">{u.pacote}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground font-medium">ADM · Prazo</div>
          <div className="text-sm font-medium mt-2 text-foreground">{u.adm} · {u.prazo}</div>
        </Card>
      </div>

      <Tabs defaultValue="status">
        <TabsList className="bg-muted">
          <TabsTrigger value="status"><ListChecks className="h-4 w-4 mr-1.5" />Status da Obra</TabsTrigger>
          <TabsTrigger value="pacote"><Package className="h-4 w-4 mr-1.5" />Pacote</TabsTrigger>
          <TabsTrigger value="person"><Palette className="h-4 w-4 mr-1.5" />Personalização</TabsTrigger>
          <TabsTrigger value="tarefas"><Check className="h-4 w-4 mr-1.5" />Tarefas</TabsTrigger>
          <TabsTrigger value="fotos"><ImageIcon className="h-4 w-4 mr-1.5" />Fotos</TabsTrigger>
          <TabsTrigger value="compras"><ShoppingCart className="h-4 w-4 mr-1.5" />Lista de Compras</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="mt-4">
          <Card className="p-5">
            <h2 className="font-semibold text-foreground mb-1">Etapas da obra</h2>
            <p className="text-xs text-muted-foreground mb-4">{etapas.filter(e => e.status === "Finalizado").length} de {etapas.length} etapas concluídas</p>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {etapas.map((e, i) => (
                <li key={i} className="flex items-center justify-between gap-3 bg-background rounded-md border px-3 py-2">
                  <span className="text-sm text-foreground">
                    <span className="text-muted-foreground tabular-nums mr-2">{String(i + 1).padStart(2, "0")}.</span>
                    {e.nome}
                  </span>
                  <StatusBadge status={e.status} />
                </li>
              ))}
            </ol>
          </Card>
        </TabsContent>

        <TabsContent value="pacote" className="mt-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-foreground">Pacote {u.pacote}</h2>
              <span className="inline-flex rounded-md bg-primary/15 text-primary px-2.5 py-1 text-xs font-medium">{u.pacote}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{pacote.descricao}</p>
            <ul className="space-y-2">
              {pacote.itens.map((it) => (
                <li key={it} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-status-em-dia mt-0.5 shrink-0" /> {it}
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="person" className="mt-4">
          <Card className="p-5">
            <h2 className="font-semibold text-foreground mb-4">Personalização da unidade</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Paleta de cores</dt>
                <dd className="text-foreground mt-1">{person.paletaCores}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Estilo</dt>
                <dd className="text-foreground mt-1">{person.estilo}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Observações</dt>
                <dd className="text-foreground mt-1">{person.observacoes}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Itens extras</dt>
                {person.itensExtras.length === 0 ? (
                  <dd className="text-muted-foreground text-sm">Nenhum item extra contratado.</dd>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {person.itensExtras.map((x) => (
                      <li key={x} className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground">{x}</li>
                    ))}
                  </ul>
                )}
              </div>
            </dl>
          </Card>
        </TabsContent>

        <TabsContent value="tarefas" className="mt-4">
          <Card className="p-5">
            <h2 className="font-semibold text-foreground mb-1">Tarefas e progresso</h2>
            <p className="text-xs text-muted-foreground mb-4">Acompanhamento operacional da unidade</p>
            <div className="space-y-3">
              {tarefas.map((t) => (
                <div key={t.titulo} className="rounded-md border bg-background px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-foreground">{t.titulo}</div>
                      <div className="text-xs text-muted-foreground">Responsável: {t.responsavel}</div>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <ProgressBar value={t.progresso} />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="fotos" className="mt-4">
          <Card className="p-5">
            <h2 className="font-semibold text-foreground mb-1">Fotos da obra</h2>
            <p className="text-xs text-muted-foreground mb-4">Registro fotográfico das últimas vistorias</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FOTOS_OBRA.map((f) => (
                <figure key={f.url} className="rounded-md overflow-hidden border bg-background">
                  <img src={f.url} alt={f.legenda} className="h-44 w-full object-cover" loading="lazy" />
                  <figcaption className="px-3 py-2 text-xs text-muted-foreground">{f.legenda}</figcaption>
                </figure>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="compras" className="mt-4">
          <Card className="overflow-hidden p-0">
            <div className="p-5 pb-3">
              <h2 className="font-semibold text-foreground">Lista de compras da unidade</h2>
              <p className="text-xs text-muted-foreground mt-1">{compras.length} itens vinculados · Total {formatBRL(compras.reduce((s, c) => s + c.valorTotal / Math.max(1, c.qtde), 0))}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Produto</th>
                    <th className="text-left font-medium px-4 py-3">Especificações</th>
                    <th className="text-left font-medium px-4 py-3">Fornecedor</th>
                    <th className="text-left font-medium px-4 py-3">Prazo</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.map((c) => (
                    <tr key={c.codigo} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{c.produto}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[260px]">{c.especificacoes}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.fornecedor}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.prazoEntrega}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                  {compras.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma compra vinculada a esta unidade.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}