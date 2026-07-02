"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { CategoriaRelatorio } from "@/types";
import { SubcategoriaRow } from "./SubcategoriaRow";
import { TransacaoItem } from "./TransacaoItem";
import { ChevronDown, ChevronRight, Tag } from "lucide-react";

interface CategoriaAccordionProps {
  categoria: CategoriaRelatorio;
  rank: number;
}

export function CategoriaAccordion({ categoria, rank }: CategoriaAccordionProps) {
  const [expanded, setExpanded] = useState(rank < 3); // Top 3 categories start expanded

  const totalTransacoes =
    categoria.transacoesDiretas.length +
    categoria.subcategorias.reduce((sum, sub) => sum + sub.transacoes.length, 0);

  return (
    <div className="glass-panel rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.3)]" id={`categoria-${categoria.categoriaId ?? 'sem-categoria'}`}>
      {/* Category header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-all duration-200"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center text-muted-foreground transition-transform duration-200"
               style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
            <ChevronDown size={18} />
          </div>

          {/* Color indicator + rank */}
          <div className="relative">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-lg"
              style={{
                backgroundColor: (categoria.cor || "#6B7280") + "20",
                border: `1px solid ${(categoria.cor || "#6B7280")}40`,
              }}
            >
              <Tag size={16} style={{ color: categoria.cor || "#6B7280" }} />
            </div>
            <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-bold text-primary flex items-center justify-center">
              {rank}
            </span>
          </div>

          <div className="text-left min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {categoria.nome}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalTransacoes} {totalTransacoes === 1 ? "transação" : "transações"}
              {categoria.subcategorias.length > 0 && (
                <span> • {categoria.subcategorias.length} {categoria.subcategorias.length === 1 ? "subcategoria" : "subcategorias"}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 ml-4">
          {/* Percentage bar */}
          <div className="hidden sm:flex items-center gap-2 w-32">
            <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(categoria.percentual, 100)}%`,
                  backgroundColor: categoria.cor || "#6B7280",
                }}
              />
            </div>
            <span className="text-xs font-semibold text-muted-foreground tabular-nums w-12 text-right">
              {categoria.percentual.toFixed(1)}%
            </span>
          </div>

          {/* Mobile percentage */}
          <span className="sm:hidden text-xs font-medium text-muted-foreground tabular-nums px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
            {categoria.percentual.toFixed(1)}%
          </span>

          {/* Total value */}
          <span className="text-base font-bold tabular-nums min-w-[120px] text-right"
                style={{ color: categoria.cor || "#6B7280" }}>
            {formatCurrency(categoria.totalCategoria)}
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border/20 pb-3 pt-1 animate-in slide-in-from-top-2 duration-200">
          {/* Subcategories */}
          {categoria.subcategorias.map((sub) => (
            <SubcategoriaRow key={sub.subcategoriaId} subcategoria={sub} />
          ))}

          {/* Direct transactions (no subcategory) */}
          {categoria.transacoesDiretas.length > 0 && (
            <div className="ml-6 pl-4">
              {categoria.subcategorias.length > 0 && (
                <div className="text-xs text-muted-foreground/60 uppercase tracking-wider px-2 pt-2 pb-1">
                  Diretas (sem subcategoria)
                </div>
              )}
              <div className="space-y-0.5">
                {categoria.transacoesDiretas.map((tx) => (
                  <TransacaoItem key={tx.id} transacao={tx} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
