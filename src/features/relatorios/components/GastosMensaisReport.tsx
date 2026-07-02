"use client";

import { formatCurrency } from "@/lib/utils";
import { useRelatorioGastos } from "@/hooks/use-relatorio-gastos";
import { CategoriaAccordion } from "./CategoriaAccordion";
import { MonthYearSelector } from "./MonthYearSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { ReceiptText, TrendingDown, Layers } from "lucide-react";
import { useState } from "react";

export function GastosMensaisReport() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);

  const { data: relatorio, isLoading, isError } = useRelatorioGastos(ano, mes);

  const handleMonthChange = (newAno: number, newMes: number) => {
    setAno(newAno);
    setMes(newMes);
  };

  return (
    <div className="space-y-6" id="gastos-mensais-report">
      {/* Header with month selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
            Relatório de Gastos
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <ReceiptText size={16} className="text-primary" />
            Análise detalhada por categoria • Somente transações pagas
          </p>
        </div>
        <MonthYearSelector mes={mes} ano={ano} onChange={handleMonthChange} />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {/* Summary skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel rounded-xl p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </div>
          {/* Category skeletons */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="glass-panel rounded-xl p-8 text-center">
          <div className="text-destructive/60 mb-2">
            <ReceiptText size={40} className="mx-auto" />
          </div>
          <p className="text-foreground font-semibold mb-1">Erro ao carregar relatório</p>
          <p className="text-sm text-muted-foreground">
            Não foi possível buscar os dados. Verifique sua conexão e tente novamente.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && relatorio && relatorio.categorias.length === 0 && (
        <div className="glass-panel rounded-xl p-12 text-center" id="empty-state">
          <div className="text-muted-foreground/30 mb-4">
            <ReceiptText size={56} className="mx-auto" />
          </div>
          <p className="text-lg font-semibold text-foreground/80 mb-1">
            Nenhum gasto neste mês
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Não foram encontradas despesas pagas para o período selecionado.
            Transações pendentes, atrasadas ou canceladas não são consideradas neste relatório.
          </p>
        </div>
      )}

      {/* Data content */}
      {!isLoading && !isError && relatorio && relatorio.categorias.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total geral */}
            <div className="glass-panel rounded-xl p-4 border-l-4 border-destructive/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Total de Gastos
              </p>
              <p className="text-2xl font-bold text-destructive/90 tabular-nums">
                {formatCurrency(relatorio.totalGeral)}
              </p>
            </div>

            {/* Quantidade de categorias */}
            <div className="glass-panel rounded-xl p-4 border-l-4 border-primary/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Layers size={12} />
                Categorias
              </p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {relatorio.categorias.length}
              </p>
            </div>

            {/* Maior gasto (categoria top 1) */}
            <div className="glass-panel rounded-xl p-4 border-l-4"
                 style={{ borderColor: (relatorio.categorias[0]?.cor || "#6B7280") + "80" }}>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <TrendingDown size={12} />
                Maior Gasto
              </p>
              <p className="text-lg font-bold text-foreground truncate">
                {relatorio.categorias[0]?.nome}
              </p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {formatCurrency(relatorio.categorias[0]?.totalCategoria || 0)}
                <span className="ml-1.5 text-xs">
                  ({relatorio.categorias[0]?.percentual.toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>

          {/* Categories accordion list */}
          <div className="space-y-3" id="categorias-list">
            {relatorio.categorias.map((cat, index) => (
              <CategoriaAccordion
                key={cat.categoriaId ?? "sem-categoria"}
                categoria={cat}
                rank={index + 1}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
