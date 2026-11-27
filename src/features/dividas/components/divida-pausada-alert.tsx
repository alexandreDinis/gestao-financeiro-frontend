"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, PlayCircle } from "lucide-react";
import { useTogglePausarPrevisaoMutation } from "../hooks/use-dividas-mutation";

interface DividaPausadaAlertProps {
  dividaId?: number | null;
  pausarPrevisao?: boolean | null;
  onDespausado?: () => void;
}

export function DividaPausadaAlert({
  dividaId,
  pausarPrevisao,
  onDespausado,
}: DividaPausadaAlertProps) {
  const toggleMutation = useTogglePausarPrevisaoMutation();
  const [despausado, setDespausado] = useState(false);

  useEffect(() => {
    setDespausado(false);
  }, [dividaId, pausarPrevisao]);

  if (!pausarPrevisao || !dividaId) return null;

  if (despausado) {
    return (
      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
        <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
        <span>
          <strong>Dívida despausada!</strong> Ela voltou a entrar no Dashboard e na Previsão de Caixa.
        </span>
      </div>
    );
  }

  const handleDespausar = async () => {
    await toggleMutation.mutateAsync({ id: dividaId, pausarPrevisao: false });
    setDespausado(true);
    onDespausado?.();
  };

  return (
    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/35 space-y-2.5">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={16} className="shrink-0 text-amber-400 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-amber-200">
            Esta dívida está pausada na previsão
          </p>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            Como houve pagamento, deseja despausar agora para que ela volte a contar no Dashboard e na Previsão de Caixa?
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleDespausar}
          disabled={toggleMutation.isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-400 text-zinc-950 hover:bg-amber-300 transition-colors disabled:opacity-50"
        >
          <PlayCircle size={14} />
          {toggleMutation.isPending ? "Despausando..." : "Sim, despausar agora"}
        </button>
      </div>
    </div>
  );
}
