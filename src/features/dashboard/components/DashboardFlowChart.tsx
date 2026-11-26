"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/hooks/use-privacy";
import type { FluxoMensal } from "@/types";

interface Props {
  data: FluxoMensal[];
  loading: boolean;
}

export function DashboardFlowChart({ data, loading }: Props) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"bars" | "area">("bars");
  const { privacyMode } = usePrivacy();

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatCompact = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
    }).format(value);

  const formatFull = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const moneyClass = `tabular-nums transition-all duration-200 ${privacyMode ? "privacy-blur" : ""}`;
  const latest = data.length > 0 ? data[data.length - 1] : null;

  if (loading || !mounted) {
    return (
      <div className="glass-panel rounded-2xl p-5 h-[390px] flex flex-col justify-between">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-44 bg-white/10" />
            <Skeleton className="h-3.5 w-56 bg-white/5" />
          </div>
          <Skeleton className="h-8 w-44 bg-white/10 rounded-xl" />
        </div>
        <Skeleton className="h-[240px] w-full bg-white/5 rounded-xl" />
        <Skeleton className="h-5 w-full bg-white/5" />
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Fluxo de Caixa · 6 Meses</h2>
          <p className="text-xs text-muted-foreground">
            {mode === "bars"
              ? "Comparativo mensal de receitas vs despesas"
              : "Evolução do saldo líquido mensal"}
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setMode("bars")}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              mode === "bars"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Comparativo
          </button>
          <button
            type="button"
            onClick={() => setMode("area")}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              mode === "area"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Curva Líquida
          </button>
        </div>
      </div>

      <div className={`h-[255px] w-full ${privacyMode ? "privacy-blur" : ""}`}>
        <ResponsiveContainer width="100%" height="100%">
          {mode === "bars" ? (
            <BarChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.07)" />
              <XAxis
                dataKey="mesLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickFormatter={formatCompact}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  backgroundColor: "#111111",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: "12px",
                  color: "#f5f5f5",
                  fontSize: "12px",
                }}
                formatter={(value: unknown, name: unknown) => [
                  formatFull(Number(value || 0)),
                  String(name || ""),
                ]}
              />
              <Bar name="Receitas" dataKey="receitas" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={24} />
              <Bar name="Despesas" dataKey="despesas" fill="#f87171" radius={[6, 6, 0, 0]} maxBarSize={24} />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="saldoLiquidoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.07)" />
              <XAxis
                dataKey="mesLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickFormatter={formatCompact}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111111",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: "12px",
                  color: "#f5f5f5",
                  fontSize: "12px",
                }}
                formatter={(value: unknown) => [formatFull(Number(value || 0)), "Saldo Líquido"]}
              />
              <Area
                name="Saldo Líquido"
                type="monotone"
                dataKey="saldo"
                stroke="#ffffff"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#saldoLiquidoGrad)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {latest && (
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            Último mês (<strong className="text-foreground">{latest.mesLabel}</strong>)
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-muted-foreground">
              Receitas{" "}
              <strong className={`text-emerald-400 ${moneyClass}`}>
                {formatFull(latest.receitas)}
              </strong>
            </span>
            <span className="text-muted-foreground">
              Despesas{" "}
              <strong className={`text-red-400 ${moneyClass}`}>
                {formatFull(latest.despesas)}
              </strong>
            </span>
            <span className="text-muted-foreground">
              Saldo{" "}
              <strong
                className={`${latest.saldo >= 0 ? "text-foreground" : "text-red-400"} ${moneyClass}`}
              >
                {latest.saldo >= 0 ? "+" : ""}
                {formatFull(latest.saldo)}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
