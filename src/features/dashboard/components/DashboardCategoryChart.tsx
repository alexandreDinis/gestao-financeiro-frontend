"use client";

import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/hooks/use-privacy";
import type { GastoPorCategoria } from "@/types";

interface Props {
  data: GastoPorCategoria[];
  loading: boolean;
}

const COLORS = ["#ffffff", "#a3a3a3", "#34d399", "#fbbf24", "#f87171", "#60a5fa", "#c084fc", "#38bdf8"];

export function DashboardCategoryChart({ data, loading }: Props) {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { privacyMode } = usePrivacy();

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalGeral = useMemo(() => data.reduce((acc, item) => acc + (item.total || 0), 0), [data]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatCompact = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
    }).format(value);

  const moneyClass = `tabular-nums transition-all duration-200 ${privacyMode ? "privacy-blur" : ""}`;

  if (loading || !mounted) {
    return (
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <Skeleton className="h-5 w-40 bg-white/10" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-32 w-32 rounded-full bg-white/5 shrink-0" />
          <div className="flex-1 space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-5 flex flex-col justify-center items-center text-center min-h-[240px]">
        <h2 className="text-base font-bold text-foreground">Gastos por Categoria</h2>
        <p className="text-xs text-muted-foreground mt-1">Sem despesas categorizadas neste mês.</p>
      </div>
    );
  }

  const activeItem = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Gastos por Categoria</h2>
          <p className="text-xs text-muted-foreground">Passe o mouse para detalhar</p>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">{data.length} itens</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 my-1">
        <div className="relative w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={64}
                paddingAngle={3}
                dataKey="total"
                nameKey="nomeCategoria"
                stroke="none"
                onMouseEnter={(_, idx) => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((_, idx) => (
                  <Cell
                    key={`cat-${idx}`}
                    fill={COLORS[idx % COLORS.length]}
                    fillOpacity={activeIndex === null || activeIndex === idx ? 1 : 0.35}
                    className="cursor-pointer transition-opacity duration-150"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
            <span className="text-[10px] text-muted-foreground truncate max-w-[78px]">
              {activeItem ? activeItem.nomeCategoria : "Total"}
            </span>
            <span className={`text-sm font-bold text-foreground ${moneyClass}`}>
              {activeItem ? formatCompact(activeItem.total) : formatCompact(totalGeral)}
            </span>
            {activeItem && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {activeItem.percentualSobreTotal.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 w-full space-y-1.5 max-h-[168px] overflow-y-auto pr-1">
          {data.slice(0, 6).map((item, idx) => {
            const isHighlighted = activeIndex === idx;
            return (
              <div
                key={item.categoriaId ?? idx}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  isHighlighted ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="truncate text-foreground">{item.nomeCategoria}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className={`text-muted-foreground hidden sm:inline ${moneyClass}`}>
                    {formatCurrency(item.total)}
                  </span>
                  <span className="font-mono font-semibold text-foreground tabular-nums w-9 text-right">
                    {item.percentualSobreTotal.toFixed(0)}%
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
