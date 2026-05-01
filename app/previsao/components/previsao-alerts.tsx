"use client";

import { PrevisaoMesResponse } from "@/hooks/use-previsao";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PrevisaoAlertsProps {
  meses: PrevisaoMesResponse[];
}

export default function PrevisaoAlerts({ meses }: PrevisaoAlertsProps) {
  if (meses.length === 0) return null;

  // Analisar os próximos 12 meses
  const primeiroMesNegativo = meses.find(m => m.saldoFinal < 0);
  const saldoCaindoNosProximos3 = meses.length >= 3 && 
    (meses[0].saldoFinal > meses[1].saldoFinal && meses[1].saldoFinal > meses[2].saldoFinal);
  const crescimentos = meses.filter((m, i) => i > 0 && m.saldoFinal >= meses[i-1].saldoFinal).length;
  
  let type: 'danger' | 'warning' | 'success' = 'success';
  let title = "Crescimento Saudável";
  let message = "Projeção de caixa positivo e estável para o ano.";
  let Icon = TrendingUp;

  if (primeiroMesNegativo) {
    type = 'danger';
    const dataRef = new Date(primeiroMesNegativo.ano, primeiroMesNegativo.mes - 1);
    title = `Alerta Crítico: Risco em ${format(dataRef, "MMMM", { locale: ptBR })}`;
    message = `Seu saldo final pode ficar negativo a partir de ${format(dataRef, "MMMM/yy", { locale: ptBR })}.`;
    Icon = AlertCircle;
  } else if (saldoCaindoNosProximos3) {
    type = 'warning';
    title = "Atenção ao Fluxo de Caixa";
    message = "Seu caixa tem tendência de queda nos próximos 3 meses.";
    Icon = TrendingDown;
  } else if (crescimentos < 4 && meses[meses.length - 1].saldoFinal < meses[0].saldoInicial) {
    type = 'warning';
    title = "Atenção ao Longo Prazo";
    message = "Você fechará o ano com menos saldo do que começou.";
    Icon = TrendingDown;
  }

  const bgColor = type === 'danger' ? 'bg-rose-500/10 border-rose-500/20' 
                : type === 'warning' ? 'bg-amber-500/10 border-amber-500/20' 
                : 'bg-emerald-500/10 border-emerald-500/20';

  const iconColor = type === 'danger' ? 'text-rose-500' 
                  : type === 'warning' ? 'text-amber-500' 
                  : 'text-emerald-500';

  return (
    <div className={`flex items-start gap-4 p-6 rounded-xl border ${bgColor} h-full`}>
      <div className={`p-3 rounded-full bg-background/50 ${iconColor}`}>
        <Icon size={24} />
      </div>
      <div>
        <h4 className={`text-lg font-semibold ${iconColor}`}>{title}</h4>
        <p className="text-muted-foreground mt-1">{message}</p>
      </div>
    </div>
  );
}
