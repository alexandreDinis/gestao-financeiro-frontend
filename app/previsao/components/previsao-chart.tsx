"use client";

import { PrevisaoMesResponse } from "@/hooks/use-previsao";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line } from "recharts";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PrevisaoChartProps {
  meses: PrevisaoMesResponse[];
}

export default function PrevisaoChart({ meses }: PrevisaoChartProps) {
  const [mostrarVariavel, setMostrarVariavel] = useState(true);

  let currentSaldoFixo = meses.length > 0 ? meses[0].saldoInicial : 0;

  const data = meses.map((m) => {
    const [ano, mes] = m.mes.split("-").map(Number);
    const dataRef = new Date(ano, mes - 1);
    
    currentSaldoFixo = currentSaldoFixo 
      + m.receitasFixas 
      - m.despesasFixas 
      + m.ajusteManual.entrada 
      - m.ajusteManual.saida;

    const ret = {
      mes: format(dataRef, "MMM/yy", { locale: ptBR }),
      saldoTotal: m.saldoFinal,
      saldoFixo: currentSaldoFixo,
    };
    
    return ret;
  });

  const minSaldoTotal = Math.min(...data.map(d => d.saldoTotal));
  const minSaldoFixo = Math.min(...data.map(d => d.saldoFixo));
  const minGeral = Math.min(minSaldoTotal, minSaldoFixo);
  const gradientId = minGeral < 0 ? "colorNegative" : "colorPositive";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2 pr-4">
        <Switch 
          id="toggle-variavel" 
          checked={mostrarVariavel} 
          onCheckedChange={setMostrarVariavel}
        />
        <Label htmlFor="toggle-variavel" className="text-xs text-muted-foreground cursor-pointer">
          Incluir Estimativa Variável
        </Label>
      </div>
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
            formatter={(value: any, name: any) => {
              if (name === "saldoTotal") return [formatCurrency(Number(value) || 0), "Saldo Previsto Total"];
              if (name === "saldoFixo") return [formatCurrency(Number(value) || 0), "Saldo Fixo (Garantido)"];
              return [formatCurrency(Number(value) || 0), String(name || "")];
            }}
            labelStyle={{ color: 'black' }}
            itemStyle={{ color: 'black' }}
          />
          {mostrarVariavel && (
            <Area 
              type="monotone" 
              dataKey="saldoTotal" 
              name="saldoTotal"
              stroke="#f59e0b" // amber-500
              strokeDasharray="5 5"
              fillOpacity={0.4} 
              fill={`url(#${minGeral < 0 ? 'colorMixed' : gradientId})`} 
              strokeWidth={2} 
            />
          )}
          <Line 
            type="monotone" 
            dataKey="saldoFixo" 
            name="saldoFixo"
            stroke={minSaldoFixo < 0 ? "#ef4444" : "#10b981"} 
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
