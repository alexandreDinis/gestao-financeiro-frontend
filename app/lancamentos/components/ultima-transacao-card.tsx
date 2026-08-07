"use client";

import { useUltimaTransacao } from "@/hooks/use-transacoes";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO, differenceInDays, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Wallet, 
  Sparkles,
  Plus,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UltimaTransacaoCardProps {
  contaId?: number;
  onNewTransactionFromDate?: (dateStr: string, tipo: "RECEITA" | "DESPESA") => void;
}

interface ItemCardProps {
  tipo: "RECEITA" | "DESPESA";
  contaId?: number;
  onNewTransactionFromDate?: (dateStr: string, tipo: "RECEITA" | "DESPESA") => void;
}

function ItemCard({ tipo, contaId, onNewTransactionFromDate }: ItemCardProps) {
  const { data: ultima, isLoading } = useUltimaTransacao({ contaId, tipo });

  const isReceita = tipo === "RECEITA";
  const title = isReceita ? "Última Entrada (Receita)" : "Última Saída (Despesa)";
  const typeBgClass = isReceita
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : "bg-rose-500/10 text-rose-400 border-rose-500/20";

  const valorTextClass = isReceita ? "text-emerald-400" : "text-rose-400";
  const HeaderIcon = isReceita ? TrendingUp : TrendingDown;
  const ArrowIcon = isReceita ? ArrowUpRight : ArrowDownRight;

  if (isLoading) {
    return (
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-4 animate-pulse flex flex-col gap-3">
        <div className="h-5 w-36 bg-slate-800 rounded" />
        <div className="h-8 w-48 bg-slate-800 rounded" />
      </div>
    );
  }

  if (!ultima) {
    return (
      <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg border ${typeBgClass}`}>
            <HeaderIcon size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">{title}</p>
            <p className="text-xs font-medium text-slate-500">Nenhum lançamento registrado</p>
          </div>
        </div>
      </div>
    );
  }

  const dataTransacao = parseISO(ultima.data);
  const dataCadastro = ultima.createdAt ? parseISO(ultima.createdAt) : dataTransacao;
  const diasAtras = differenceInDays(new Date(), dataTransacao);
  const tempoCadastroRelativo = formatDistanceToNow(dataCadastro, { addSuffix: true, locale: ptBR });

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800/90 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 p-4 backdrop-blur-md shadow-lg shadow-black/20 transition-all hover:border-slate-700/80 flex flex-col justify-between gap-3">
      {/* Background Glow */}
      <div 
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-15 pointer-events-none"
        style={{ backgroundColor: isReceita ? "#10b981" : "#f43f5e" }}
      />

      <div className="space-y-2">
        {/* Header Badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${typeBgClass}`}>
            <HeaderIcon size={13} />
            {title}
          </span>

          {diasAtras > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
              ⚠️ Há {diasAtras} d{diasAtras > 1 ? "ias" : "ia"} sem lançar
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
              <Sparkles size={10} /> Hoje
            </span>
          )}
        </div>

        {/* Transaction Description & Amount */}
        <div className="flex items-baseline justify-between gap-2 flex-wrap pt-1">
          <h3 className="text-sm font-bold text-white tracking-tight truncate max-w-[200px]" title={ultima.descricao}>
            {ultima.descricao}
          </h3>
          <span className={`text-base font-extrabold ${valorTextClass}`}>
            {isReceita ? "+" : "-"} {formatCurrency(ultima.valor)}
          </span>
        </div>

        {/* Transaction Details Footer */}
        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap pt-1 border-t border-slate-800/60">
          <span className="flex items-center gap-1">
            <Calendar size={12} className="text-slate-500" />
            Extrato: <strong className="text-slate-200">{format(dataTransacao, "dd/MM/yyyy")}</strong>
          </span>

          {ultima.contaNome && (
            <span className="flex items-center gap-1 truncate max-w-[150px]">
              <Wallet size={12} className="text-slate-500 shrink-0" />
              <strong className="text-slate-200 truncate">{ultima.contaNome}</strong>
            </span>
          )}

          <span className="text-[11px] text-slate-500 w-full sm:w-auto">
            (cadastrado {tempoCadastroRelativo})
          </span>
        </div>
      </div>

      {/* Action Button */}
      {onNewTransactionFromDate && (
        <div className="pt-2 flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onNewTransactionFromDate(ultima.data, tipo)}
            className="w-full sm:w-auto h-7 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700 hover:border-slate-600 shadow-sm text-xs gap-1"
          >
            <Plus size={12} className={isReceita ? "text-emerald-400" : "text-rose-400"} />
            Continuar {isReceita ? "Entradas" : "Saídas"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function UltimaTransacaoCard({ contaId, onNewTransactionFromDate }: UltimaTransacaoCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ItemCard tipo="RECEITA" contaId={contaId} onNewTransactionFromDate={onNewTransactionFromDate} />
      <ItemCard tipo="DESPESA" contaId={contaId} onNewTransactionFromDate={onNewTransactionFromDate} />
    </div>
  );
}
