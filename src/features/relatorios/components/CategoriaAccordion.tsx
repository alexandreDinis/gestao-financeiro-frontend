"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { CategoriaRelatorio } from "@/types";
import { SubcategoriaRow } from "./SubcategoriaRow";
import { TransacaoItem } from "./TransacaoItem";
import { ChevronDown, Tag } from "lucide-react";
import { usePrivacy } from "@/hooks/use-privacy";

interface CategoriaAccordionProps {
  categoria: CategoriaRelatorio;
  rank: number;
  expanded?: boolean;
  onToggle?: () => void;
  accentColor?: string;
}

export function CategoriaAccordion({
  categoria,
  rank,
  expanded: controlledExpanded,
  onToggle,
  accentColor,
}: CategoriaAccordionProps) {
  const [internalExpanded, setInternalExpanded] = useState(rank <= 2);
  const { privacyMode } = usePrivacy();

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const handleToggle = () => {
    if (onToggle) onToggle();
    else setInternalExpanded((prev) => !prev);
  };

  const totalTransacoes =
    categoria.transacoesDiretas.length +
    categoria.subcategorias.reduce((sum, sub) => sum + sub.transacoes.length, 0);

  const color = accentColor || categoria.cor || "#a3a3a3";
  const moneyClass = `tabular-nums transition-all duration-200 ${privacyMode ? "privacy-blur" : ""}`;

  return (
    <div
      className="rounded-xl bg-black/35 border border-white/10 hover:border-white/20 overflow-hidden transition-all duration-200"
      id={`categoria-${categoria.categoriaId ?? "sem-categoria"}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-4 hover:bg-white/[0.025] transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="text-muted-foreground transition-transform duration-200 shrink-0"
            style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}
          >
            <ChevronDown size={16} />
          </div>

          <div className="relative shrink-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: `${color}1f`,
                border: `1px solid ${color}45`,
              }}
            >
              <Tag size={15} style={{ color }} />
            </div>
            <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-background border border-white/15 text-[10px] font-mono font-bold text-foreground flex items-center justify-center">
              {rank}
            </span>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{categoria.nome}</p>
            <p className="text-xs text-muted-foreground">
              {totalTransacoes} {totalTransacoes === 1 ? "lançamento" : "lançamentos"}
              {categoria.subcategorias.length > 0 && (
                <span>
                  {" "}
                  · {categoria.subcategorias.length}{" "}
                  {categoria.subcategorias.length === 1 ? "subcategoria" : "subcategorias"}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0 ml-auto">
          <div className="hidden md:flex items-center gap-2 w-28">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(categoria.percentual, 100)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-white/5 border border-white/10 text-muted-foreground tabular-nums">
            {categoria.percentual.toFixed(1)}%
          </span>

          <span
            className={`text-base font-bold min-w-[108px] text-right text-foreground ${moneyClass}`}
          >
            {formatCurrency(categoria.totalCategoria)}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div
          className={`border-t border-white/10 pb-3 pt-1 px-2 sm:px-3 ${
            privacyMode ? "[&_.tabular-nums]:privacy-blur" : ""
          }`}
        >
          {categoria.subcategorias.map((sub) => (
            <SubcategoriaRow key={sub.subcategoriaId} subcategoria={sub} />
          ))}

          {categoria.transacoesDiretas.length > 0 && (
            <div className="ml-4 sm:ml-6 pl-3 border-l border-white/10 mt-1">
              {categoria.subcategorias.length > 0 && (
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 pt-2 pb-1">
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
