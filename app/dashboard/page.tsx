"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Eye, EyeOff, Plus, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { usePrivacy } from "@/hooks/use-privacy";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";

import { DashboardAlerts } from "@/features/dashboard/components/DashboardAlerts";
import { DashboardMetricCards } from "@/features/dashboard/components/DashboardMetricCards";
import { DashboardProjection } from "@/features/dashboard/components/DashboardProjection";
import { DashboardFlowChart } from "@/features/dashboard/components/DashboardFlowChart";
import { DashboardCategoryChart } from "@/features/dashboard/components/DashboardCategoryChart";
import { DashboardCreditCards } from "@/features/dashboard/components/DashboardCreditCards";
import { DashboardRecentTransactions } from "@/features/dashboard/components/DashboardRecentTransactions";
import { DashboardBudgets } from "@/features/dashboard/components/DashboardBudgets";

export default function DashboardPage() {
  const { data: dashboard, isLoading, isError, isFetching, refetch } = useDashboard();
  const { privacyMode, togglePrivacyMode } = usePrivacy();
  const [activityTab, setActivityTab] = useState<"vencimentos" | "recentes">("vencimentos");
  const vencimentosRef = useRef<HTMLDivElement>(null);

  const healthScore = useMemo(() => {
    if (!dashboard) return null;
    let score = 100;
    for (const alerta of dashboard.alertas || []) {
      if (alerta.nivel === "CRITICO") score -= 18;
      else if (alerta.nivel === "AVISO") score -= 8;
      else score -= 3;
    }
    if ((dashboard.saldoTotal ?? 0) < 0) score -= 20;
    return Math.max(15, Math.min(100, score));
  }, [dashboard]);

  const handleFocusVencimentos = () => {
    setActivityTab("vencimentos");
    vencimentosRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const moneyClass = `tabular-nums transition-all duration-200 ${privacyMode ? "privacy-blur" : ""}`;

  const referenceLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <AppLayout>
      <div className="space-y-6 pb-10">
        {/* Header Command Center */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Command Center
              </h1>
              {healthScore !== null && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    healthScore >= 80
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : healthScore >= 55
                        ? "bg-amber-400/15 text-amber-300 border-amber-400/30"
                        : "bg-red-500/15 text-red-400 border-red-500/30"
                  }`}
                >
                  Score {healthScore}/100
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground capitalize mt-0.5">
              {referenceLabel} · Telemetria financeira em tempo real
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
              title="Atualizar dados"
            >
              <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <button
              type="button"
              onClick={togglePrivacyMode}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-foreground hover:border-white/25 transition-colors inline-flex items-center gap-1.5"
            >
              {privacyMode ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{privacyMode ? "Mostrar" : "Privacidade"}</span>
            </button>

            <Link
              href="/lancamentos"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,255,255,0.12)]"
            >
              <Plus size={14} />
              Novo Lançamento
            </Link>
          </div>
        </div>

        {/* Estado de Erro Resiliente */}
        {isError && (
          <div className="glass-panel rounded-2xl border border-red-500/35 p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-400 shrink-0" size={20} />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Não foi possível carregar os dados do Dashboard
                </p>
                <p className="text-xs text-muted-foreground">
                  Verifique sua conexão com o servidor e tente novamente.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* 1. Faixa Compacta de Alertas */}
        {dashboard?.alertas && dashboard.alertas.length > 0 && (
          <DashboardAlerts
            alertas={dashboard.alertas}
            loading={isLoading}
            onFocusVencimentos={handleFocusVencimentos}
          />
        )}

        {/* 2. Bento KPI Grid (4 Métricas com Sparklines, Pills de Conta e Anel de Poupança) */}
        <DashboardMetricCards
          saldoTotal={dashboard?.saldoTotal ?? 0}
          saldoPorConta={dashboard?.saldoPorConta}
          mesAtual={dashboard?.mesAtual}
          comparativo={dashboard?.comparativo}
          fluxo={dashboard?.fluxoCaixaSeisMeses}
          loading={isLoading}
        />

        {/* 3. Smart Projection & Timeline Mensal Interativa */}
        <DashboardProjection
          projecao={dashboard?.projecao}
          vencimentos={dashboard?.proximosVencimentos?.proximos30Dias}
          loading={isLoading}
        />

        {/* 4. Grade Principal Analytics & Operação (7 / 5) */}
        <div className="grid gap-6 xl:grid-cols-12">
          {/* Coluna Esquerda (7 cols) */}
          <div className="xl:col-span-7 space-y-6">
            <DashboardFlowChart
              data={dashboard?.fluxoCaixaSeisMeses || []}
              loading={isLoading}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DashboardCategoryChart
                data={dashboard?.gastosPorCategoria || []}
                loading={isLoading}
              />
              <DashboardCreditCards
                cartoes={dashboard?.cartoes || []}
                loading={isLoading}
              />
            </div>
          </div>

          {/* Coluna Direita (5 cols) */}
          <div className="xl:col-span-5 space-y-6" ref={vencimentosRef}>
            <DashboardRecentTransactions
              recentes={dashboard?.ultimasTransacoes || []}
              proximosVencimentos={dashboard?.proximosVencimentos}
              loading={isLoading}
              activeTab={activityTab}
              onTabChange={setActivityTab}
            />
            <DashboardBudgets
              orcamentos={dashboard?.orcamentos || []}
              loading={isLoading}
            />
          </div>
        </div>

        {/* 5. Metas Financeiras */}
        {dashboard?.metas && dashboard.metas.length > 0 && (
          <section className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Metas Financeiras</h2>
                <p className="text-xs text-muted-foreground">Acompanhamento de objetivos</p>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {dashboard.metas.length} {dashboard.metas.length === 1 ? "meta" : "metas"}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {dashboard.metas.map((meta) => {
                const pct = Math.min(100, Math.max(0, meta.percentualConcluido || 0));
                return (
                  <div
                    key={meta.id}
                    className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{meta.nome}</p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                          meta.atrasada
                            ? "bg-red-500/15 text-red-400"
                            : "bg-emerald-500/15 text-emerald-400"
                        }`}
                      >
                        {meta.atrasada ? "Atrasada" : "No prazo"}
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          meta.atrasada ? "bg-amber-400" : "bg-primary"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className={moneyClass}>
                        <strong className="text-foreground">{formatCurrency(meta.valorAtual)}</strong>{" "}
                        de {formatCurrency(meta.valorAlvo)}
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
