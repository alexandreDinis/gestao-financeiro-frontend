"use client";

import { useDividasQuery } from "../hooks/use-dividas-query";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, AlertTriangle, TrendingUp, TrendingDown, Users } from "lucide-react";
import { usePessoasQuery } from "@/features/pessoas/hooks/use-pessoas-query";

export function DividasResumo() {
  // Passamos undefined para buscar todas as dívidas e sumarizar
  const { data: resumo, isLoading: loadingDividas } = useDividasQuery();
  const { data: pessoas, isLoading: loadingPessoas } = usePessoasQuery();

  if (loadingDividas || loadingPessoas) {
    return <div className="h-32 glass-panel border-border/40 rounded-xl animate-pulse" />;
  }

  const dividas = resumo?.items || [];
  let totalReceber = 0;
  let totalPagar = 0;
  let atrasadosScore = 0; // Quantidade de contas atrasadas

  dividas.forEach(d => {
    if (d.tipo === 'A_RECEBER') {
      totalReceber += d.valorRestante;
    } else {
      totalPagar += d.valorRestante;
    }

    // Calcula se tem alguma parcela atrasada nesta divida
    const temAtraso = d.parcelas.some(p => {
      if (p.status === 'PAGO' || p.status === 'CANCELADO') return false;
      return new Date(p.dataVencimento) < new Date();
    });

    if (temAtraso) atrasadosScore += 1;
  });

  const saldoLiquidoPrevisto = totalReceber - totalPagar;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Métrica: A Receber */}
      <div className="glass-panel p-4 rounded-xl border-t-2 border-t-green-500 relative overflow-hidden group">
        <div className="flex justify-between items-start mb-2 relative z-10">
          <p className="text-sm font-medium text-muted-foreground group-hover:text-green-400 transition-colors">A Receber Total</p>
          <div className="p-1.5 rounded-md bg-green-500/10 text-green-500">
            <ArrowUpRight size={16} />
          </div>
        </div>
        <div className="relative z-10">
          <h4 className="text-2xl font-bold text-white tracking-tight">{formatCurrency(totalReceber)}</h4>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <TrendingUp size={12} className="text-green-500" />
            <span>Esperado até fim do ano</span>
          </div>
        </div>
        
        {/* Sparkline Decorativo */}
        <div className="absolute -bottom-2 -right-2 opacity-20 pointer-events-none">
          <svg width="100" height="40" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40C20 40 20 15 40 20C60 25 70 5 100 0" stroke="#22c55e" strokeWidth="4" />
          </svg>
        </div>
      </div>

      {/* 2. Métrica: A Pagar */}
      <div className="glass-panel p-4 rounded-xl border-t-2 border-t-red-500 relative overflow-hidden group">
        <div className="flex justify-between items-start mb-2 relative z-10">
          <p className="text-sm font-medium text-muted-foreground group-hover:text-red-400 transition-colors">A Pagar Total</p>
          <div className="p-1.5 rounded-md bg-red-500/10 text-red-500">
            <ArrowDownRight size={16} />
          </div>
        </div>
        <div className="relative z-10">
          <h4 className="text-2xl font-bold text-white tracking-tight">{formatCurrency(totalPagar)}</h4>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <TrendingDown size={12} className="text-red-500" />
            <span>Comprometido até fim do ano</span>
          </div>
        </div>
        
        {/* Sparkline Decorativo */}
        <div className="absolute -bottom-2 -right-2 opacity-20 pointer-events-none">
          <svg width="100" height="40" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0C20 0 40 25 60 20C80 15 80 40 100 40" stroke="#ef4444" strokeWidth="4" />
          </svg>
        </div>
      </div>

      {/* 3. Métrica: Saldo Líquido Futuro */}
      <div className="glass-panel p-4 rounded-xl border-t-2 border-t-blue-500 relative overflow-hidden">
        <div className="flex justify-between items-start mb-2 relative z-10">
          <p className="text-sm font-medium text-muted-foreground">Saldo Líquido Previsto</p>
          <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
            <Users size={16} />
          </div>
        </div>
        <div className="relative z-10">
          <h4 className={`text-2xl font-bold tracking-tight ${saldoLiquidoPrevisto >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {formatCurrency(saldoLiquidoPrevisto)}
          </h4>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <span>Com {pessoas?.length || 0} contatos na rede</span>
          </div>
        </div>
      </div>

      {/* 4. Métrica: Alertas Constantes */}
      <div className={`glass-panel p-4 rounded-xl border-t-2 relative overflow-hidden ${atrasadosScore > 0 ? 'border-t-orange-500 bg-orange-500/5' : 'border-t-gray-500'}`}>
        <div className="flex justify-between items-start mb-2 relative z-10">
          <p className="text-sm font-medium text-muted-foreground">Índice de Atrasos</p>
          <div className={`p-1.5 rounded-md ${atrasadosScore > 0 ? 'bg-orange-500/20 text-orange-500 animate-pulse' : 'bg-gray-500/10 text-gray-500'}`}>
            <AlertTriangle size={16} />
          </div>
        </div>
        <div className="relative z-10">
          <h4 className={`text-2xl font-bold tracking-tight ${atrasadosScore > 0 ? 'text-orange-500' : 'text-white'}`}>
            {atrasadosScore} {atrasadosScore === 1 ? 'dívida' : 'dívidas'}
          </h4>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            {atrasadosScore > 0 
              ? <span className="text-orange-400/80">Necessitam cobrança/atenção</span> 
              : <span>Carteira 100% em dia</span>}
          </div>
        </div>
      </div>

    </div>
  );
}
