"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useRelatorioFluxo } from "@/hooks/use-relatorio-fluxo";
import { usePrivacy } from "@/hooks/use-privacy";

export function RelatorioTrendChart() {
  const [range, setRange] = useState<6 | 12>(6);
  const [mounted, setMounted] = useState(false);
  const { data: fluxo = [], isLoading } = useRelatorioFluxo(range);
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
  const latest = fluxo.length > 0 ? fluxo[fluxo.length - 1] : null;

  return (
    <section className="glass-panel rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Tendência Histórica · Entradas vs Saídas
          </h2>
          <p className="text-xs text-muted-foreground">
            Comparativo consolidado dos últimos {range} meses
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setRange(6)}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              range === 6
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            6M
          </button>
          <button
            type="button"
            onClick={() => setRange(12)}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              range === 12
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            12M
          </button>
        </div>
      </div>

      {isLoading || !mounted ? (
        <Skeleton className="h-[205px] w-full bg-white/5 rounded-xl" />
      ) : fluxo.length === 0 ? (
        <div className="h-[205px] flex items-center justify-center text-xs text-muted-foreground">
          Sem dados históricos para o período.
        </div>
      ) : (
        <div className={`h-[205px] w-full ${privacyMode ? "privacy-blur" : ""}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fluxo} margin={{ top: 8, right: 10, left: -12, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.07)" />
              <XAxis
                dataKey="mesLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                dy={6}
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
              <Bar name="Entradas" dataKey="receitas" fill="#34d399" radius={[5, 5, 0, 0]} maxBarSize={20} />
              <Bar name="Saídas" dataKey="despesas" fill="#f87171" radius={[5, 5, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {latest && (
        <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            Último mês (<strong className="text-foreground">{latest.mesLabel}</strong>)
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-muted-foreground">
              Entradas{" "}
              <strong className={`text-emerald-400 ${moneyClass}`}>
                {formatFull(latest.receitas)}
              </strong>
            </span>
            <span className="text-muted-foreground">
              Saídas{" "}
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
    </section>
  );
}
