"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { SubcategoriaRelatorio } from "@/types";
import { TransacaoItem } from "./TransacaoItem";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SubcategoriaRowProps {
  subcategoria: SubcategoriaRelatorio;
}

export function SubcategoriaRow({ subcategoria }: SubcategoriaRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ml-6 border-l-2 border-border/20 pl-4">
      {/* Subcategory header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-2.5 px-2 rounded-md hover:bg-white/[0.03] transition-all duration-200 group"
        id={`subcategoria-${subcategoria.subcategoriaId}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center text-muted-foreground">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
          {subcategoria.cor && (
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: subcategoria.cor }}
            />
          )}
          <span className="text-sm font-medium text-foreground/80 truncate">
            {subcategoria.nome}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            ({subcategoria.transacoes.length} {subcategoria.transacoes.length === 1 ? "item" : "itens"})
          </span>
        </div>

        <div className="flex items-center gap-4 shrink-0 ml-3">
          <span className="text-xs font-medium text-muted-foreground tabular-nums px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
            {subcategoria.percentual.toFixed(1)}%
          </span>
          <span className="text-sm font-semibold text-foreground/90 tabular-nums min-w-[100px] text-right">
            {formatCurrency(subcategoria.totalSubcategoria)}
          </span>
        </div>
      </button>

      {/* Transactions list */}
      {expanded && (
        <div className="mt-1 mb-2 ml-5 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
          {subcategoria.transacoes.map((tx) => (
            <TransacaoItem key={tx.id} transacao={tx} />
          ))}
        </div>
      )}
    </div>
  );
}
