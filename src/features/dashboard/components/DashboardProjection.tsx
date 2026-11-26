"use client";

import { useMemo, useState } from "react";
import { Calendar, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/hooks/use-privacy";
import type { ProjecaoMes, Vencimento } from "@/types";

interface Props {
  projecao?: ProjecaoMes;
  vencimentos?: Vencimento[];
  loading: boolean;
}

export function DashboardProjection({ projecao, vencimentos = [], loading }: Props) {
  const { privacyMode } = usePrivacy();
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const moneyClass = `tabular-nums transition-all duration-200 ${privacyMode ? "privacy-blur" : ""}`;

  const monthMarkers = useMemo(() => {
    if (!projecao || !vencimentos.length) return [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return vencimentos
      .filter((v) => {
        if (!v.dataVencimento) return false;
        const d = new Date(v.dataVencimento + "T12:00:00Z");
        return d.getUTCFullYear() === currentYear && d.getUTCMonth() === currentMonth;
      })
      .slice(0, 8)
      .map((v) => {
        const d = new Date(v.dataVencimento + "T12:00:00Z");
        const day = d.getUTCDate();
        const pct = Math.max(3, Math.min(97, (day / Math.max(1, projecao.diasTotais)) * 100));
        return {
          ...v,
          day,
          pct,
        };
      });
  }, [projecao, vencimentos]);

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-52 bg-white/10" />
          <Skeleton className="h-5 w-28 bg-white/10" />
        </div>
        <Skeleton className="h-16 w-full bg-white/5 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!projecao) return null;

  const diasRestantes = Math.max(0, projecao.diasTotais - projecao.diasDecorridos);
  const progressPct = Math.max(
    2,
    Math.min(100, (projecao.diasDecorridos / Math.max(1, projecao.diasTotais)) * 100)
  );

  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(new Date())
    .replace(".", "");

  const defaultTimelineText = `Hoje (Dia ${projecao.diasDecorridos}/${projecao.diasTotais}) — ${
    diasRestantes === 0
      ? "Último dia do mês"
      : `${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"} para fechar o mês`
  }${monthMarkers.length > 0 ? ` · ${monthMarkers.length} compromissos mapeados neste mês` : ""}`;

  return (
    <section className="glass-panel rounded-2xl p-5 space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
            <Zap size={15} className="text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Smart Projection &amp; Timeline Mensal
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar size={12} />
              Dia {projecao.diasDecorridos} de {projecao.diasTotais} ·{" "}
              <strong className="text-foreground">
                {diasRestantes} {diasRestantes === 1 ? "dia restante" : "dias restantes"}
              </strong>
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-muted-foreground tabular-nums">
          Progresso: <strong className="text-foreground">{progressPct.toFixed(0)}%</strong>
        </span>
      </div>

      {/* Timeline Interativa do Mês */}
      <div className="p-4 rounded-xl bg-black/35 border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-3">
          <span className="text-muted-foreground font-mono uppercase">01 {monthLabel}</span>
          <span className="text-foreground font-medium text-center truncate max-w-full sm:max-w-[70%]">
            {hoverInfo || defaultTimelineText}
          </span>
          <span className="text-muted-foreground font-mono uppercase">
            {projecao.diasTotais} {monthLabel}
          </span>
        </div>

        <div className="relative h-8 flex items-center">
          {/* Trilho base */}
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Marcadores de compromissos reais do mês */}
          {monthMarkers.map((m) => {
            const isReceita = m.tipo === "RECEITA";
            const colorClass = m.atrasado
              ? "bg-red-500"
              : isReceita
                ? "bg-emerald-400"
                : "bg-amber-400";
            return (
              <button
                key={m.idUnico}
                type="button"
                onMouseEnter={() =>
                  setHoverInfo(
                    `Dia ${String(m.day).padStart(2, "0")} · ${m.descricao} (${
                      privacyMode ? "••••" : formatCurrency(m.valor)
                    })`
                  )
                }
                onMouseLeave={() => setHoverInfo(null)}
                style={{ left: `${m.pct}%` }}
                className={`absolute -translate-x-1/2 w-3.5 h-3.5 rounded-full ${colorClass} border-2 border-background hover:scale-125 transition-transform cursor-pointer`}
                title={`${m.descricao} — Dia ${m.day}`}
              />
            );
          })}

          {/* Marcador pulsante de HOJE */}
          <button
            type="button"
            onMouseEnter={() => setHoverInfo(defaultTimelineText)}
            onMouseLeave={() => setHoverInfo(null)}
            style={{ left: `${progressPct}%` }}
            className="absolute -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-2 border-background today-beacon hover:scale-125 transition-transform cursor-pointer z-10"
            title={`Hoje — Dia ${projecao.diasDecorridos}`}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" /> Hoje (Dia {projecao.diasDecorridos})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> A receber
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> A pagar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Atrasado
          </span>
        </div>
      </div>

      {/* 3 Pilares de Projeção (A Receber Restante · A Pagar Restante · Saldo Projetado) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* A Receber Restante */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              A Receber (Restante)
            </span>
            <TrendingUp size={15} className="text-emerald-400" />
          </div>
          <div className={`text-xl font-bold text-emerald-400 mt-2 ${moneyClass}`}>
            {formatCurrency(projecao.receitasPendentes)}
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Total projetado</span>
            <strong className={`text-foreground ${moneyClass}`}>
              {formatCurrency(projecao.receitasProjetadas)}
            </strong>
          </div>
        </div>

        {/* A Pagar Restante */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              A Pagar (Restante)
            </span>
            <TrendingDown size={15} className="text-red-400" />
          </div>
          <div className={`text-xl font-bold text-red-400 mt-2 ${moneyClass}`}>
            {formatCurrency(projecao.despesasPendentes)}
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Total projetado</span>
            <strong className={`text-foreground ${moneyClass}`}>
              {formatCurrency(projecao.despesasProjetadas)}
            </strong>
          </div>
        </div>

        {/* Saldo Projetado (Fim do Mês) */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Saldo Projetado (Fim do Mês)
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                projecao.saldoProjetado >= 0
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {projecao.saldoProjetado >= 0 ? "Positivo" : "Atenção"}
            </span>
          </div>
          <div
            className={`text-xl font-bold mt-2 ${
              projecao.saldoProjetado >= 0 ? "text-foreground" : "text-red-400"
            } ${moneyClass}`}
          >
            {formatCurrency(projecao.saldoProjetado)}
          </div>
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Saldo líquido estimado</span>
            <strong
              className={`${
                projecao.receitasProjetadas - projecao.despesasProjetadas >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              } ${moneyClass}`}
            >
              {formatCurrency(projecao.receitasProjetadas - projecao.despesasProjetadas)}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
