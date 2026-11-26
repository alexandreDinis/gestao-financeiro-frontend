"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Info, ShieldAlert, X } from "lucide-react";
import type { AlertaDashboard } from "@/types";

interface Props {
  alertas: AlertaDashboard[];
  loading: boolean;
  onFocusVencimentos?: () => void;
}

export function DashboardAlerts({ alertas, loading, onFocusVencimentos }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (loading || dismissed || !alertas || alertas.length === 0) return null;

  const sorted = [...alertas].sort((a, b) => {
    const rank = (n: string) => (n === "CRITICO" ? 3 : n === "AVISO" ? 2 : 1);
    return rank(b.nivel) - rank(a.nivel);
  });

  const primary = sorted[0];
  const isCritico = primary.nivel === "CRITICO";
  const isAviso = primary.nivel === "AVISO";

  const borderTone = isCritico
    ? "border-red-500/40"
    : isAviso
      ? "border-amber-400/35"
      : "border-white/15";

  const badgeTone = isCritico
    ? "bg-red-500/15 text-red-400 border-red-500/30"
    : isAviso
      ? "bg-amber-400/15 text-amber-300 border-amber-400/30"
      : "bg-white/10 text-foreground border-white/15";

  const getIcon = (nivel: string) => {
    if (nivel === "CRITICO") return ShieldAlert;
    if (nivel === "AVISO") return AlertTriangle;
    return Info;
  };

  const PrimaryIcon = getIcon(primary.nivel);
  const hasVencimentoAlert = sorted.some((a) => a.tipo === "VENCIMENTO_PROXIMO");

  return (
    <div className={`glass-panel rounded-2xl border ${borderTone} px-4 py-3 transition-all`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border shrink-0 ${badgeTone}`}
          >
            <PrimaryIcon size={13} />
            {sorted.length === 1 ? primary.nivel : `${sorted.length} Alertas`}
          </span>
          <p className="text-xs sm:text-sm text-foreground truncate">
            {primary.mensagem}
            {sorted.length > 1 && !expanded && (
              <span className="text-muted-foreground ml-2">
                (+{sorted.length - 1} {sorted.length - 1 === 1 ? "outro" : "outros"})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasVencimentoAlert && onFocusVencimentos && (
            <button
              type="button"
              onClick={onFocusVencimentos}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-foreground hover:border-primary/40 transition-colors"
            >
              Ver vencimentos →
            </button>
          )}
          {sorted.length > 1 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              {expanded ? (
                <>
                  Recolher <ChevronUp size={13} />
                </>
              ) : (
                <>
                  Ver todos <ChevronDown size={13} />
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            aria-label="Ocultar alertas"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {expanded && sorted.length > 1 && (
        <div className="mt-3 pt-3 border-t border-white/10 grid gap-2 sm:grid-cols-2">
          {sorted.slice(1).map((alerta, idx) => {
            const Icon = getIcon(alerta.nivel);
            const iconColor =
              alerta.nivel === "CRITICO"
                ? "text-red-400"
                : alerta.nivel === "AVISO"
                  ? "text-amber-300"
                  : "text-muted-foreground";
            return (
              <div
                key={`${alerta.tipo}-${idx}`}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-black/30 border border-white/5"
              >
                <Icon size={15} className={`shrink-0 mt-0.5 ${iconColor}`} />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                    {alerta.tipo.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alerta.mensagem}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
