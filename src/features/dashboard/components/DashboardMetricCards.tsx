"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/hooks/use-privacy";
import type { ComparativoMes, FluxoMensal, ResumoMes, SaldoConta } from "@/types";

interface Props {
  saldoTotal: number;
  saldoPorConta?: SaldoConta[];
  mesAtual?: ResumoMes;
  comparativo?: ComparativoMes;
  fluxo?: FluxoMensal[];
  loading: boolean;
}

function buildSparklinePoints(values: number[]): string {
  if (!values || values.length < 2) return "2,18 66,18";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = 2 + (i / (values.length - 1)) * 64;
      const y = 20 - ((v - min) / span) * 16;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function DashboardMetricCards({
  saldoTotal,
  saldoPorConta = [],
  mesAtual,
  comparativo,
  fluxo = [],
  loading,
}: Props) {
  const { privacyMode } = usePrivacy();
  const [selectedContaId, setSelectedContaId] = useState<number | "ALL">("ALL");

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const selectedSaldo = useMemo(() => {
    if (selectedContaId === "ALL") return saldoTotal;
    const found = saldoPorConta.find((c) => c.id === selectedContaId);
    return found ? found.saldo : saldoTotal;
  }, [saldoPorConta, saldoTotal, selectedContaId]);

  const sparkSaldos = useMemo(() => buildSparklinePoints(fluxo.map((f) => f.saldo)), [fluxo]);
  const sparkReceitas = useMemo(() => buildSparklinePoints(fluxo.map((f) => f.receitas)), [fluxo]);
  const sparkDespesas = useMemo(() => buildSparklinePoints(fluxo.map((f) => f.despesas)), [fluxo]);

  const receitas = mesAtual?.receitas ?? 0;
  const despesas = mesAtual?.despesas ?? 0;
  const balanco = mesAtual?.saldo ?? 0;

  const taxaPoupanca = receitas > 0 ? Math.max(0, Math.min(100, (balanco / receitas) * 100)) : 0;
  const comprometimento = receitas > 0 ? Math.min(999, (despesas / receitas) * 100) : 0;
  const ringCircumference = 2 * Math.PI * 18;
  const ringOffset = ringCircumference * (1 - taxaPoupanca / 100);

  const moneyClass = `tabular-nums transition-all duration-200 ${privacyMode ? "privacy-blur" : ""}`;

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-28 bg-white/10" />
              <Skeleton className="h-4 w-12 bg-white/10 rounded-full" />
            </div>
            <Skeleton className="h-8 w-36 bg-white/10" />
            <Skeleton className="h-4 w-full bg-white/5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* 1. Saldo Consolidado + Pills interativas por conta */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between hover:border-white/20 transition-all">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Saldo Consolidado
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            {saldoPorConta.length > 0 ? `${saldoPorConta.length} contas` : "Total"}
          </span>
        </div>

        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div
            className={`text-2xl font-bold tracking-tight ${
              selectedSaldo >= 0 ? "text-foreground" : "text-red-400"
            } ${moneyClass}`}
          >
            {formatCurrency(selectedSaldo)}
          </div>
          <svg width="68" height="24" viewBox="0 0 68 24" className="shrink-0 opacity-90">
            <polyline
              fill="none"
              stroke="var(--chart-3)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sparkSaldos}
            />
          </svg>
        </div>

        <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedContaId("ALL")}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
              selectedContaId === "ALL"
                ? "bg-primary text-primary-foreground"
                : "bg-white/5 text-muted-foreground hover:text-foreground border border-white/10"
            }`}
          >
            Todas
          </button>
          {saldoPorConta.slice(0, 3).map((conta) => (
            <button
              key={conta.id}
              type="button"
              onClick={() => setSelectedContaId(conta.id)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium truncate max-w-[92px] transition-colors ${
                selectedContaId === conta.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-muted-foreground hover:text-foreground border border-white/10"
              }`}
              title={`${conta.nome}: ${formatCurrency(conta.saldo)}`}
            >
              {conta.nome}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Receitas do Mês */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between hover:border-white/20 transition-all">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Receitas (Mês)
          </span>
          {comparativo && comparativo.variacaoReceitasPercent !== 0 ? (
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${
                comparativo.variacaoReceitasPercent > 0
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {comparativo.variacaoReceitasPercent > 0 ? (
                <TrendingUp size={11} />
              ) : (
                <TrendingDown size={11} />
              )}
              {Math.abs(comparativo.variacaoReceitasPercent).toFixed(1)}%
            </span>
          ) : (
            <ArrowUpRight size={15} className="text-emerald-400" />
          )}
        </div>

        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div className={`text-2xl font-bold tracking-tight text-emerald-400 ${moneyClass}`}>
            {formatCurrency(receitas)}
          </div>
          <svg width="68" height="24" viewBox="0 0 68 24" className="shrink-0 opacity-90">
            <polyline
              fill="none"
              stroke="var(--chart-3)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sparkReceitas}
            />
          </svg>
        </div>

        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>Mês anterior</span>
          <span className={`text-foreground font-medium ${moneyClass}`}>
            {formatCurrency(comparativo?.receitasMesAnterior ?? 0)}
          </span>
        </div>
      </div>

      {/* 3. Despesas do Mês */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between hover:border-white/20 transition-all">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Despesas (Mês)
          </span>
          {comparativo && comparativo.variacaoDespesasPercent !== 0 ? (
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums ${
                comparativo.variacaoDespesasPercent <= 0
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {comparativo.variacaoDespesasPercent > 0 ? (
                <TrendingUp size={11} />
              ) : (
                <TrendingDown size={11} />
              )}
              {Math.abs(comparativo.variacaoDespesasPercent).toFixed(1)}%
            </span>
          ) : (
            <ArrowDownRight size={15} className="text-red-400" />
          )}
        </div>

        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div className={`text-2xl font-bold tracking-tight text-red-400 ${moneyClass}`}>
            {formatCurrency(despesas)}
          </div>
          <svg width="68" height="24" viewBox="0 0 68 24" className="shrink-0 opacity-90">
            <polyline
              fill="none"
              stroke="var(--chart-5)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sparkDespesas}
            />
          </svg>
        </div>

        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>Comprometimento</span>
          <span
            className={`font-semibold tabular-nums ${
              comprometimento > 90
                ? "text-red-400"
                : comprometimento > 75
                  ? "text-amber-300"
                  : "text-foreground"
            }`}
          >
            {comprometimento.toFixed(0)}% da receita
          </span>
        </div>
      </div>

      {/* 4. Balanço Mensal + Anel Radial de Taxa de Poupança */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between hover:border-white/20 transition-all">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Balanço Mensal
          </span>
          <span className="text-[11px] text-muted-foreground">Poupança</span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div
              className={`text-2xl font-bold tracking-tight truncate ${
                balanco >= 0 ? "text-foreground" : "text-red-400"
              } ${moneyClass}`}
            >
              {balanco >= 0 ? "+" : ""}
              {formatCurrency(balanco)}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Resultado líquido</p>
          </div>

          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="4"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke={balanco >= 0 ? "var(--primary)" : "var(--destructive)"}
                strokeWidth="4"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[11px] font-bold tabular-nums text-foreground">
              {taxaPoupanca.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>Status do mês</span>
          <span className={balanco >= 0 ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>
            {balanco >= 0 ? "Superávit" : "Déficit"}
          </span>
        </div>
      </div>
    </div>
  );
}
