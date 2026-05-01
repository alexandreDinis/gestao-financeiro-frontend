"use client";

import { PrevisaoMesResponse, useSalvarAjustePrevisao } from "@/hooks/use-previsao";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X, Info } from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface PrevisaoTableProps {
  meses: PrevisaoMesResponse[];
}

export default function PrevisaoTable({ meses }: PrevisaoTableProps) {
  const [localMeses, setLocalMeses] = useState<PrevisaoMesResponse[]>(meses);
  const salvarAjuste = useSalvarAjustePrevisao();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  useEffect(() => {
    // Only update local state if we aren't actively editing to prevent focus loss
    if (!editingKey) {
      setLocalMeses(meses);
    }
  }, [meses, editingKey]);

  const handleEditClick = (mes: number, ano: number, type: 'entrada' | 'saida', currentValue: number) => {
    setEditingKey(`${mes}-${ano}-${type}`);
    setEditValue(currentValue > 0 ? currentValue.toString() : "");
  };

  const handleBlur = (index: number, type: 'entrada' | 'saida') => {
    if (!editingKey) return;
    
    const mesObj = localMeses[index];
    const val = parseFloat(editValue) || 0;
    
    // Check if value actually changed
    const currentVal = type === 'entrada' ? mesObj.ajusteEntrada : mesObj.ajusteSaida;
    if (val !== currentVal) {
      salvarAjuste.mutate({
        mes: mesObj.mes,
        ano: mesObj.ano,
        ajusteEntrada: type === 'entrada' ? val : mesObj.ajusteEntrada,
        ajusteSaida: type === 'saida' ? val : mesObj.ajusteSaida
      });
      
      // Optmistic local update for cascade effect until server responds
      const newMeses = [...localMeses];
      if (type === 'entrada') newMeses[index].ajusteEntrada = val;
      if (type === 'saida') newMeses[index].ajusteSaida = val;
      
      let currentSaldo = index > 0 ? newMeses[index-1].saldoFinal : newMeses[index].saldoInicial;
      for (let i = index; i < newMeses.length; i++) {
        newMeses[i].saldoInicial = currentSaldo;
        newMeses[i].saldoFinal = currentSaldo 
          + newMeses[i].entradasPrevistas 
          + newMeses[i].ajusteEntrada 
          - newMeses[i].saidasPrevistas 
          - newMeses[i].ajusteSaida;
        currentSaldo = newMeses[i].saldoFinal;
      }
      setLocalMeses(newMeses);
    }
    
    setEditingKey(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg">Mês</th>
            <th className="px-4 py-3">Saldo Inicial</th>
            <th className="px-4 py-3">Previsto Sistema</th>
            <th className="px-4 py-3">
              <div className="flex items-center gap-1.5">
                Ajuste Manual
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-xs">
                      Use para incluir entradas ou saídas que ainda não estão registradas no sistema para este mês.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </th>
            <th className="px-4 py-3 rounded-tr-lg">Saldo Final</th>
          </tr>
        </thead>
        <tbody>
          {localMeses.map((m, idx) => {
            const dataRef = new Date(m.ano, m.mes - 1);
            const mesFormatado = format(dataRef, "MMMM/yy", { locale: ptBR });
            
            const isEditingEntrada = editingKey === `${m.mes}-${m.ano}-entrada`;
            const isEditingSaida = editingKey === `${m.mes}-${m.ano}-saida`;

            return (
              <tr key={`${m.mes}-${m.ano}`} className="border-b border-border/50 hover:bg-muted/20">
                <td className="px-4 py-3 font-medium capitalize">{mesFormatado}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatCurrency(m.saldoInicial)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-emerald-500">+{formatCurrency(m.entradasPrevistas)}</span>
                    <span className="text-rose-500">-{formatCurrency(m.saidasPrevistas)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    {/* Entrada Manual */}
                    <div className="flex items-center gap-2 group">
                      {isEditingEntrada ? (
                        <div className="flex items-center gap-1">
                          <Input
                            autoFocus
                            className="h-7 w-24 px-1 py-0 text-xs text-emerald-500 bg-emerald-500/5 border-emerald-500/30"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleBlur(idx, 'entrada')}
                            onKeyUp={(e) => e.key === 'Escape' && setEditingKey(null)}
                            type="number"
                          />
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleBlur(idx, 'entrada')}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:bg-muted/10" onClick={() => setEditingKey(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div 
                            className="flex-1 text-emerald-500 font-medium cursor-pointer hover:text-emerald-400 transition-colors"
                            onClick={() => handleEditClick(m.mes, m.ano, 'entrada', m.ajusteEntrada)}
                          >
                            +{formatCurrency(m.ajusteEntrada)}
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                            onClick={() => handleEditClick(m.mes, m.ano, 'entrada', m.ajusteEntrada)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {/* Saída Manual */}
                    <div className="flex items-center gap-2 group">
                      {isEditingSaida ? (
                        <div className="flex items-center gap-1">
                          <Input
                            autoFocus
                            className="h-7 w-24 px-1 py-0 text-xs text-rose-500 bg-rose-500/5 border-rose-500/30"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleBlur(idx, 'saida')}
                            onKeyUp={(e) => e.key === 'Escape' && setEditingKey(null)}
                            type="number"
                          />
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-500 hover:bg-rose-500/10" onClick={() => handleBlur(idx, 'saida')}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:bg-muted/10" onClick={() => setEditingKey(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div 
                            className="flex-1 text-rose-500 font-medium cursor-pointer hover:text-rose-400 transition-colors"
                            onClick={() => handleEditClick(m.mes, m.ano, 'saida', m.ajusteSaida)}
                          >
                            -{formatCurrency(m.ajusteSaida)}
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                            onClick={() => handleEditClick(m.mes, m.ano, 'saida', m.ajusteSaida)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </td>
                <td className={`px-4 py-3 font-bold ${m.saldoFinal < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {formatCurrency(m.saldoFinal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
