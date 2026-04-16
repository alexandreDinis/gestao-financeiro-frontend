"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { GastoPorCategoria } from "@/types";

interface Props {
  data: GastoPorCategoria[];
  loading: boolean;
}

export function DashboardCategoryChart({ data, loading }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7', '#ec4899', '#f97316', '#06b6d4'];

  if (loading) {
    return (
      <Card className="glass-panel h-[400px]">
        <CardHeader>
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-48 bg-white/10 rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent className="h-full flex items-center justify-center -mt-10">
           <div className="h-[200px] w-[200px] rounded-full bg-white/5 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) return null;

  return (
    <Card className="glass-panel h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle>Gastos por Categoria</CardTitle>
        <CardDescription>Distribuição percentual no mês</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="total"
              nameKey="nomeCategoria"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
               contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid #ffffff10',
                borderRadius: '12px',
                color: '#fff'
              }}
              formatter={(value: any) => [formatCurrency(Number(value || 0)), '']}
            />
            <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                wrapperStyle={{ paddingLeft: '20px' }}
                formatter={(value: string) => {
                    const item = data.find(d => d.nomeCategoria === value);
                    return (
                        <span className="text-xs text-muted-foreground">
                            {value} ({item?.percentualSobreTotal.toFixed(0)}%)
                        </span>
                    );
                }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
