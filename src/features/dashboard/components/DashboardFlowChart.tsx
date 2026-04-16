"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { FluxoMensal } from "@/types";

interface Props {
  data: FluxoMensal[];
  loading: boolean;
}

export function DashboardFlowChart({ data, loading }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact"
    }).format(value);
  };

  if (loading) {
    return (
      <Card className="glass-panel h-[400px]">
        <CardHeader>
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-48 bg-white/10 rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent className="h-full flex items-center justify-center -mt-10">
           <div className="h-[250px] w-full bg-white/5 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle>Fluxo de Caixa</CardTitle>
        <CardDescription>Receitas vs Despesas (Últimos 6 meses)</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
            <XAxis 
              dataKey="mesLabel" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid #ffffff10',
                borderRadius: '12px',
                color: '#fff'
              }}
              itemStyle={{ fontSize: '12px' }}
              formatter={(value: any) => [formatCurrency(Number(value || 0)), '']}
            />
            <Legend verticalAlign="top" height={36}/>
            <Area 
              name="Receitas"
              type="monotone" 
              dataKey="receitas" 
              stroke="#22c55e" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorReceitas)" 
            />
            <Area 
              name="Despesas"
              type="monotone" 
              dataKey="despesas" 
              stroke="#ef4444" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorDespesas)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
