"use client";

import Link from "next/link";
import { AlertCircle, ArrowUpRight, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/hooks/use-privacy";
import type { ResumoCartao } from "@/types";

interface Props {
  cartoes: ResumoCartao[];
  loading: boolean;
}

export function DashboardCreditCards({ cartoes, loading }: Props) {
  const { privacyMode } = usePrivacy();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + "T12:00:00Z");
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(d);
  };

  const moneyClass = `tabular-nums transition-all duration-200 ${privacyMode ? "privacy-blur" : ""}`;

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <Skeleton className="h-5 w-36 bg-white/10" />
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full bg-white/5 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!cartoes || cartoes.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-5 flex flex-col justify-center items-center text-center min-h-[240px]">
        <CreditCard size={24} className="text-muted-foreground mb-2 opacity-60" />
        <h2 className="text-base font-bold text-foreground">Cartões de Crédito</h2>
        <p className="text-xs text-muted-foreground mt-1">Nenhum cartão cadastrado.</p>
        <Link
          href="/cartoes"
          className="mt-3 text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          Gerenciar cartões <ArrowUpRight size={12} />
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <CreditCard size={16} className="text-primary" />
            Cartões de Crédito
          </h2>
          <p className="text-xs text-muted-foreground">Faturas atuais e uso do limite</p>
        </div>
        <Link
          href="/cartoes"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          Ver todos <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[250px] pr-1">
        {cartoes.map((cartao) => {
          const pct = Math.min(100, Math.max(0, cartao.percentualUtilizado || 0));
          const isHigh = pct >= 80;
          const vencLabel = formatDate(cartao.proximoVencimento);

          return (
            <div
              key={cartao.cartaoId}
              className={`p-3.5 rounded-xl bg-gradient-to-br from-white/[0.05] to-black/50 border space-y-2.5 transition-colors ${
                isHigh ? "border-amber-400/35" : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{cartao.nome}</p>
                  <p className="text-[11px] font-mono text-muted-foreground">
                    {vencLabel ? `Vence ${vencLabel} · ` : ""}
                    Limite <span className={moneyClass}>{formatCurrency(cartao.limite)}</span>
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold shrink-0 ${
                    isHigh
                      ? "bg-amber-400/15 text-amber-300"
                      : "bg-white/10 text-foreground"
                  }`}
                >
                  {pct.toFixed(0)}%
                </span>
              </div>

              <div className="flex items-baseline justify-between text-xs">
                <span className={`text-base font-bold text-foreground ${moneyClass}`}>
                  {formatCurrency(cartao.faturaAtual)}
                </span>
                <span className="text-muted-foreground">
                  Disp.{" "}
                  <strong className={`${isHigh ? "text-amber-300" : "text-foreground"} ${moneyClass}`}>
                    {formatCurrency(cartao.disponivel)}
                  </strong>
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isHigh ? "bg-amber-400" : "bg-primary"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {isHigh && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90">
                  <AlertCircle size={12} />
                  Uso elevado do limite disponível
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
