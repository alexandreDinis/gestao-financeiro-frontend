import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Check, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { ParcelaDivida } from "../types";
import { usePagarParcelaMutation } from "../hooks/use-dividas-mutation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DividaTimelineProps {
  parcelas: ParcelaDivida[];
  totalParcelas: number;
  dividaId: number;
  onPagar?: (parcela: ParcelaDivida) => void;
}

export function DividaTimeline({ parcelas, totalParcelas, dividaId, onPagar }: DividaTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  // Ordena parcelas por vencimento
  const sortedParcelas = [...parcelas].sort((a, b) => 
    new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime()
  );

  const getStatusColor = (parcela: ParcelaDivida) => {
    if (parcela.status === 'PAGO') return "bg-green-500/20 text-green-500 border-green-500/50";
    if (parcela.status === 'CANCELADO') return "bg-gray-500/20 text-gray-500 border-gray-500/50";
    
    // Check if delayed
    const daysDiff = differenceInDays(new Date(parcela.dataVencimento), new Date());
    if (daysDiff < 0) return "bg-red-500/20 text-red-500 border-red-500/50"; // Atrasado
    if (daysDiff <= 3) return "bg-orange-500/20 text-orange-500 border-orange-500/50"; // Vence em breve
    
    return "bg-black/40 text-muted-foreground border-border/50"; // Pendente normal
  };

  const handlePagar = (parcela: ParcelaDivida, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPagar) {
      onPagar(parcela);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div 
        className="flex items-center gap-1 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors w-fit"
        onClick={() => setExpanded(!expanded)}
        title="Clique para ver detalhes"
      >
        {sortedParcelas.map((p) => (
          <div 
            key={p.id}
            className={cn(
              "h-4 px-1 rounded border flex items-center justify-center text-[10px] min-w-[1rem]",
              getStatusColor(p)
            )}
          >
            {p.status === 'PAGO' ? <Check size={10} /> : `${p.numeroParcela}/${totalParcelas}`}
          </div>
        ))}
        {expanded ? <ChevronUp size={14} className="text-muted-foreground ml-1" /> : <ChevronDown size={14} className="text-muted-foreground ml-1" />}
      </div>

      {expanded && (
        <div className="pl-2 border-l-2 border-border/40 mt-2 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {sortedParcelas.map((p) => {
            const daysDiff = differenceInDays(new Date(p.dataVencimento), new Date());
            let statusText = "";
            let statusColor = "text-muted-foreground";

            if (p.status === 'PAGO') {
              statusText = `Pago em ${p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : 'N/A'}`;
              statusColor = "text-green-500";
            } else if (daysDiff < 0) {
              statusText = `Atrasado há ${Math.abs(daysDiff)} dias`;
              statusColor = "text-red-500 font-bold";
            } else if (daysDiff === 0) {
              statusText = "Vence hoje!";
              statusColor = "text-orange-500 font-bold";
            } else {
              statusText = `Vence em ${daysDiff} dias`;
            }

            const isPending = false; // Progress handled by parent or mutation state if needed

            return (
              <div key={p.id} className="flex items-center justify-between text-sm group">
                <div className="flex items-center gap-3">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs border", getStatusColor(p))}>
                     {p.status === 'PAGO' ? <Check size={12} /> : <Clock size={12} />}
                  </div>
                  <div>
                    <div className="text-white font-medium">Parcela {p.numeroParcela}/{totalParcelas} - R$ {p.valor.toFixed(2)}</div>
                    <div className={cn("text-xs", statusColor)}>{statusText}</div>
                  </div>
                </div>
                
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handlePagar(p, e)}
                  >
                    Dar Baixa
                  </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
