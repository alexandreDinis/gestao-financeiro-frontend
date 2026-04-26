"use client";

import { PrevisaoMesResponse } from "@/hooks/use-previsao";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface PrevisaoChartProps {
  meses: PrevisaoMesResponse[];
}

export default function PrevisaoChart({ meses }: PrevisaoChartProps) {
  const data = meses.map((m) => {
    const dataRef = new Date(m.ano, m.mes - 1);
    return {
      mes: format(dataRef, "MMM/yy", { locale: ptBR }),
      saldo: m.saldoFinal,
    };
  });

  const minSaldo = Math.min(...data.map(d => d.saldo));
  const gradientId = minSaldo < 0 ? "colorNegative" : "colorPositive";

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorMixed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="mes" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 12 }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 12 }}
            tickFormatter={(val) => `R$ ${val / 1000}k`}
          />
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
          <Tooltip 
            formatter={(value: any) => [formatCurrency(Number(value) || 0), "Saldo Previsto"]}
            labelStyle={{ color: 'black' }}
            itemStyle={{ color: 'black' }}
          />
          <Area 
            type="monotone" 
            dataKey="saldo" 
            stroke={minSaldo < 0 ? "#ef4444" : "#10b981"} 
            fillOpacity={1} 
            fill={`url(#${minSaldo < 0 && Math.max(...data.map(d=>d.saldo)) > 0 ? 'colorMixed' : gradientId})`} 
            strokeWidth={3} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
