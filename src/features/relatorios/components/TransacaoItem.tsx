"use client";

import { formatCurrency } from "@/lib/utils";
import type { TransacaoRelatorio } from "@/types";
import { Calendar, CreditCard } from "lucide-react";

interface TransacaoItemProps {
  transacao: TransacaoRelatorio;
}

export function TransacaoItem({ transacao }: TransacaoItemProps) {
  const dataFormatada = new Date(transacao.data + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

  const isCartao = transacao.origem === "CARTAO";

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-white/[0.02] transition-colors duration-150 group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs shrink-0">
          <Calendar size={12} className="opacity-50" />
          <span>{dataFormatada}</span>
        </div>
        <span className="text-sm text-foreground/90 truncate">
          {transacao.descricao}
        </span>
        {isCartao && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full shrink-0">
            <CreditCard size={10} />
            Cartão
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-destructive/90 tabular-nums shrink-0 ml-3">
        {formatCurrency(transacao.valor)}
      </span>
    </div>
  );
}
