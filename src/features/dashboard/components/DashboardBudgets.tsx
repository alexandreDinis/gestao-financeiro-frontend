"use client";

import Link from "next/link";
import { AlertCircle, ArrowUpRight, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/hooks/use-privacy";
import type { ResumoOrcamento } from "@/types";

interface Props {
  orcamentos: ResumoOrcamento[];
  loading: boolean;
}

export function DashboardBudgets({ orcamentos, loading }: Props) {
  const { privacyMode } = usePrivacy();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const moneyClass = `tabular-nums transition-all duration-200 ${privacyMode ? "privacy-blur" : ""}`;

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <Skeleton className="h-5 w-40 bg-white/10" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!orcamentos || orcamentos.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-5 flex flex-col justify-center items-center text-center min-h-[180px]">
        <Target size={22} className="text-muted-foreground mb-2 opacity-60" />
        <h2 className="text-base font-bold text-foreground">Orçamentos do Mês</h2>
        <p className="text-xs text-muted-foreground mt-1">Nenhum orçamento configurado.</p>
        <Link
          href="/orcamentos"
          className="mt-3 text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          Criar orçamento <ArrowUpRight size={12} />
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Orçamentos do Mês</h2>
          <p className="text-xs text-muted-foreground">Limites vs gastos reais</p>
        </div>
        <Link
          href="/orcamentos"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          Detalhes <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
        {orcamentos.map((orc, index) => {
          const pct = Math.max(0, orc.percentualUtilizado || 0);
          const isOver = orc.estourado || pct >= 100;
          const isNear = !isOver && pct >= 80;

          const barColor = isOver ? "bg-red-500" : isNear ? "bg-amber-400" : "bg-emerald-400";
          const borderColor = isOver
            ? "border-red-500/35"
            : isNear
              ? "border-amber-400/30"
              : "border-white/10";
          const pctColor = isOver
            ? "text-red-400"
            : isNear
              ? "text-amber-300"
              : "text-emerald-400";

          return (
            <div
              key={orc.orcamentoId ?? index}
              className={`p-3 rounded-xl bg-black/30 border ${borderColor} space-y-2`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground flex items-center gap-1.5 truncate">
                  {orc.categoria}
                  {isOver && <AlertCircle size={13} className="text-red-400 shrink-0" />}
                </span>
                <span className={`text-xs font-mono font-semibold tabular-nums ${pctColor}`}>
                  {pct.toFixed(0)}%
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className={moneyClass}>
                  <strong className="text-foreground">{formatCurrency(orc.gasto)}</strong> /{" "}
                  {formatCurrency(orc.limite)}
                </span>
                <span className={moneyClass}>
                  {isOver ? (
                    <strong className="text-red-400">
                      Excedeu {formatCurrency(Math.abs(orc.disponivel))}
                    </strong>
                  ) : (
                    <>
                      Restam <strong className="text-foreground">{formatCurrency(orc.disponivel)}</strong>
                    </>
                  )}
                </span>
              </div>

              {orc.subcategorias && orc.subcategorias.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[...orc.subcategorias]
                    .sort((a, b) => b.gasto - a.gasto)
                    .slice(0, 4)
                    .map((sub, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-muted-foreground"
                      >
                        <span className="truncate max-w-[84px]">{sub.nome}</span>
                        <span className={`text-foreground/85 ${moneyClass}`}>
                          {formatCurrency(sub.gasto)}
                        </span>
                      </span>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
