"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info, AlertTriangle, ShieldAlert } from "lucide-react";
import { AlertaDashboard } from "@/types";

interface Props {
  alertas: AlertaDashboard[];
  loading: boolean;
}

export function DashboardAlerts({ alertas, loading }: Props) {
  if (loading) return null;

  if (!alertas || alertas.length === 0) return null;

  const getNivelStyles = (nivel: string) => {
    switch (nivel) {
      case "CRITICO":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/50",
          text: "text-red-400",
          icon: ShieldAlert
        };
      case "AVISO":
        return {
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/50",
          text: "text-yellow-400",
          icon: AlertTriangle
        };
      default:
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/50",
          text: "text-blue-400",
          icon: Info
        };
    }
  };

  const formatTipo = (tipo: string) => {
    return tipo.replace(/_/g, " ");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <AlertCircle size={20} className="text-primary" />
        Alertas e Insights
      </h3>
      <div className="grid gap-3">
        {alertas.map((alerta, index) => {
          const styles = getNivelStyles(alerta.nivel);
          const Icon = styles.icon;
          return (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${styles.bg} ${styles.border} flex items-start gap-3 animate-in fade-in slide-in-from-right-4 duration-500`}
            >
              <Icon className={`shrink-0 mt-0.5 ${styles.text}`} size={18} />
              <div>
                <p className={`font-bold text-sm uppercase tracking-wider ${styles.text}`}>{formatTipo(alerta.tipo)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alerta.mensagem}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
