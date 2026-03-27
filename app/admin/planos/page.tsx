"use client";

import { usePlanos, PlanoResponse } from "@/hooks/use-admin";
import { CreditCard, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PlanosPage() {
  const { data: planos, isLoading, isError } = usePlanos();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="h-8 w-8 border-4 border-[#Eab308] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-panel p-8 text-center rounded-lg border-red-500/30">
        <p className="text-red-400 font-medium">Erro ao carregar os planos. A API pode estar indisponível.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="text-[#Eab308]" />
          Planos <span className="text-[#Eab308]">SaaS</span>
        </h2>
        <p className="text-muted-foreground text-sm mt-1">Visualize os planos de assinatura disponíveis na plataforma.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {planos?.map((plano: PlanoResponse) => (
          <div
            key={plano.id}
            className="glass-panel rounded-xl p-6 border-border/40 hover:border-[#Eab308]/50 transition-all duration-300 relative overflow-hidden group"
          >
            {/* Background icon */}
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CreditCard size={100} className="text-[#Eab308]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{plano.nome}</h3>
              <Badge
                variant="outline"
                className={plano.ativo
                  ? "border-green-500/50 text-green-400 bg-green-500/10"
                  : "border-red-500/50 text-red-400 bg-red-500/10"
                }
              >
                {plano.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>

            {/* Tipo */}
            <div className="mb-4">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Tipo</span>
              <p className="text-sm text-blue-400 font-medium">{plano.tipo}</p>
            </div>

            {/* Preço */}
            <div className="mb-6">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Preço Mensal</span>
              <p className="text-3xl font-bold text-[#Eab308] drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plano.precoMensal)}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>
            </div>

            {/* Limites */}
            <div className="space-y-2 text-sm border-t border-border/30 pt-4">
              <LimitRow label="Contas" value={plano.maxContas} />
              <LimitRow label="Categorias" value={plano.maxCategorias} />
              <LimitRow label="Cartões" value={plano.maxCartoes} />
              <LimitRow label="Transações/mês" value={plano.maxTransacoesMes} />
              <LimitRow label="Metas" value={plano.maxMetas} />
              <LimitRow label="Dívidas" value={plano.maxDividas} />
              <LimitRow label="Usuários" value={plano.maxUsuarios} />
              <FeatureRow label="Relatórios Avançados" enabled={plano.relatoriosAvancados} />
              <FeatureRow label="Projeção de Saldo" enabled={plano.projecaoSaldo} />
            </div>
          </div>
        ))}

        {planos?.length === 0 && (
          <div className="col-span-full glass-panel rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Nenhum plano cadastrado na tabela <code>plano</code>.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LimitRow({ label, value }: { label: string; value?: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-white font-medium">{value ?? "—"}</span>
    </div>
  );
}

function FeatureRow({ label, enabled }: { label: string; enabled?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      {enabled ? (
        <Check className="h-4 w-4 text-green-400" />
      ) : (
        <X className="h-4 w-4 text-red-400/50" />
      )}
    </div>
  );
}
