"use client";

import { formatCurrency } from "@/lib/utils";
import { useRelatorioReceitas } from "@/hooks/use-relatorio-receitas";
import { CategoriaAccordion } from "./CategoriaAccordion";
import { MonthYearSelector } from "./MonthYearSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, Calendar, Calculator, Wallet } from "lucide-react";
import { useState } from "react";

export function ReceitasMensaisReport() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);

  const { data: relatorio, isLoading, isError } = useRelatorioReceitas(ano, mes);

  const handleMonthChange = (newAno: number, newMes: number) => {
    setAno(newAno);
    setMes(newMes);
  };

  return (
    <div className="space-y-6" id="receitas-mensais-report">
      {/* Header with month selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
            Relatório de Entradas
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <ArrowUpRight size={16} className="text-emerald-400" />
            Análise detalhada por categoria • Somente receitas recebidas
          </p>
        </div>
        <MonthYearSelector mes={mes} ano={ano} onChange={handleMonthChange} />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel rounded-xl p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </div>
          {[1, 2, 3].map((i) => (
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
            <Wallet size={40} className="mx-auto text-emerald-400/60" />
          </div>
          <p className="text-foreground font-semibold mb-1">Erro ao carregar relatório</p>
          <p className="text-sm text-muted-foreground">
            Não foi possível buscar os dados de receita. Verifique sua conexão e tente novamente.
          </p>
        </div>
      )}

      {/* Main Stats Cards (Always visible once loaded) */}
      {!isLoading && !isError && relatorio && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total do Mês Selecionado */}
          <div className="glass-panel rounded-xl p-4 border-l-4 border-emerald-500/80 bg-emerald-500/5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5 font-medium">
              <ArrowUpRight size={14} className="text-emerald-400" />
              Entradas no Mês
            </p>
            <p className="text-2xl font-bold text-emerald-400 tabular-nums">
              {formatCurrency(relatorio.totalMes)}
            </p>
          </div>

          {/* Total Acumulado no Ano */}
          <div className="glass-panel rounded-xl p-4 border-l-4 border-blue-500/80 bg-blue-500/5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5 font-medium">
              <Calendar size={14} className="text-blue-400" />
              Total no Ano ({ano})
            </p>
            <p className="text-2xl font-bold text-blue-400 tabular-nums">
              {formatCurrency(relatorio.totalAno)}
            </p>
          </div>

          {/* Média Mensal */}
          <div className="glass-panel rounded-xl p-4 border-l-4 border-teal-500/80 bg-teal-500/5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5 font-medium">
              <Calculator size={14} className="text-teal-400" />
              Média Mensal
            </p>
            <p className="text-2xl font-bold text-teal-300 tabular-nums">
              {formatCurrency(relatorio.mediaMensal)}
              <span className="text-xs font-normal text-muted-foreground ml-1">/ mês</span>
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && relatorio && relatorio.categorias.length === 0 && (
        <div className="glass-panel rounded-xl p-12 text-center" id="empty-state">
          <div className="text-muted-foreground/30 mb-4">
            <Wallet size={56} className="mx-auto text-emerald-400/40" />
          </div>
          <p className="text-lg font-semibold text-foreground/80 mb-1">
            Nenhuma receita neste mês
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Não foram encontradas receitas pagas para o mês selecionado.
            Transações pendentes ou canceladas não são consideradas no relatório.
          </p>
        </div>
      )}

      {/* Data content - Categories accordion list */}
      {!isLoading && !isError && relatorio && relatorio.categorias.length > 0 && (
        <div className="space-y-3" id="categorias-list">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1 pt-2">
            Entradas por Categoria
          </h2>
          {relatorio.categorias.map((cat, index) => (
            <CategoriaAccordion
              key={cat.categoriaId ?? "sem-categoria"}
              categoria={cat}
              rank={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
