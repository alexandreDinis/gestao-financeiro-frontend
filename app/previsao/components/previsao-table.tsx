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

  const handleEditClick = (mesStr: string, type: 'entrada' | 'saida', currentValue: number) => {
    setEditingKey(`${mesStr}-${type}`);
    setEditValue(currentValue > 0 ? currentValue.toString() : "");
  };

  const handleBlur = (index: number, type: 'entrada' | 'saida') => {
    if (!editingKey) return;
    
    const mesObj = localMeses[index];
    const val = parseFloat(editValue) || 0;
    
    // Check if value actually changed
    const currentVal = type === 'entrada' ? mesObj.ajusteManual.entrada : mesObj.ajusteManual.saida;
    if (val !== currentVal) {
      salvarAjuste.mutate({
        mes: parseInt(mesObj.mes.split("-")[1], 10),
        ano: parseInt(mesObj.mes.split("-")[0], 10),
        ajusteEntrada: type === 'entrada' ? val : mesObj.ajusteManual.entrada,
        ajusteSaida: type === 'saida' ? val : mesObj.ajusteManual.saida
      });
      
      // Optmistic local update for cascade effect until server responds
      const newMeses = [...localMeses];
      if (type === 'entrada') newMeses[index].ajusteManual.entrada = val;
      if (type === 'saida') newMeses[index].ajusteManual.saida = val;
      
      let currentSaldo = index > 0 ? newMeses[index-1].saldoFinal : newMeses[index].saldoInicial;
      for (let i = index; i < newMeses.length; i++) {
        newMeses[i].saldoInicial = currentSaldo;
        newMeses[i].saldoFinal = currentSaldo 
          + newMeses[i].receitasFixas 
          - newMeses[i].despesasFixas
          - newMeses[i].estimativaVariavel.valor
          + newMeses[i].ajusteManual.entrada 
          - newMeses[i].ajusteManual.saida;
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
            <th className="px-4 py-3">
              <div className="flex items-center gap-1.5">
                Receitas Fixas
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-xs">
                      Receitas já previstas ou recorrentes
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </th>
            <th className="px-4 py-3">
              <div className="flex items-center gap-1.5">
                Despesas Fixas
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-xs">
                      Faturas e contas fixas agendadas
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </th>
            <th className="px-4 py-3">
              <div className="flex items-center gap-1.5 text-amber-500/80">
                Variável (Estimado)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px] text-xs">
                      Média móvel de gastos variáveis dos últimos meses fechados
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </th>
            <th className="px-4 py-3">
              <div className="flex items-center gap-1.5 font-semibold text-rose-500">
                Total Estimado
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px] text-xs">
                      Soma das Despesas Fixas com a Estimativa Variável do mês
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </th>
            <th className="px-4 py-3">
              <div className="flex items-center gap-1.5">
                Ajuste Manual
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-xs">
                      Use para incluir valores avulsos não cadastrados
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
            const [ano, mes] = m.mes.split("-").map(Number);
            const dataRef = new Date(ano, mes - 1);
            const mesFormatado = format(dataRef, "MMMM/yy", { locale: ptBR });
            
            const isEditingEntrada = editingKey === `${m.mes}-entrada`;
            const isEditingSaida = editingKey === `${m.mes}-saida`;

            return (
              <tr key={m.mes} className="border-b border-border/50 hover:bg-muted/20">
                <td className="px-4 py-3 font-medium capitalize">{mesFormatado}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatCurrency(m.saldoInicial)}</td>
                <td className="px-4 py-3">
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-emerald-500 border-b border-dashed border-emerald-500/30 cursor-help">
                          +{formatCurrency(m.receitasFixas)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="w-[280px] p-0" sideOffset={8}>
                        <div className="px-4 py-3 border-b border-border/50 bg-emerald-500/5">
                          <p className="font-semibold text-sm text-emerald-500">Receitas Fixas</p>
                          <p className="text-xs text-muted-foreground">Itens programados do mês</p>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto p-2">
                          <div className="space-y-1">
                            {m.detalhamentoReceitasFixas?.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs p-1.5 hover:bg-muted/50 rounded-md">
                                <span className="truncate max-w-[170px]">{item.descricao}</span>
                                <span className="font-medium text-emerald-500">+{formatCurrency(item.valor)}</span>
                              </div>
                            ))}
                            {(!m.detalhamentoReceitasFixas || m.detalhamentoReceitasFixas.length === 0) && (
                              <div className="text-xs text-center text-muted-foreground py-2">
                                Sem receitas fixas no mês
                              </div>
                            )}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
                <td className="px-4 py-3">
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-rose-500 border-b border-dashed border-rose-500/30 cursor-help">
                          -{formatCurrency(m.despesasFixas)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="w-[290px] p-0" sideOffset={8}>
                        <div className="px-4 py-3 border-b border-border/50 bg-rose-500/5">
                          <p className="font-semibold text-sm text-rose-500">Despesas Fixas</p>
                          <p className="text-xs text-muted-foreground">Faturas e parcelas programadas do mês</p>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto p-2">
                          <div className="space-y-1">
                            {m.detalhamentoDespesasFixas?.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs p-1.5 hover:bg-muted/50 rounded-md">
                                <span className="truncate max-w-[180px]">{item.descricao}</span>
                                <span className="font-medium text-rose-500">-{formatCurrency(item.valor)}</span>
                              </div>
                            ))}
                            {(!m.detalhamentoDespesasFixas || m.detalhamentoDespesasFixas.length === 0) && (
                              <div className="text-xs text-center text-muted-foreground py-2">
                                Sem despesas fixas no mês
                              </div>
                            )}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
                <td className="px-4 py-3">
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-amber-500/90 border-b border-dashed border-amber-500/30 cursor-help">
                          -{formatCurrency(m.estimativaVariavel.valor)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="w-[280px] p-0" sideOffset={8}>
                        <div className="px-4 py-3 border-b border-border/50">
                          <p className="font-semibold text-sm">Detalhamento Estimado</p>
                          <p className="text-xs text-muted-foreground">Baseado em {m.estimativaVariavel.mesesConsiderados} meses de histórico</p>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto p-2">
                          <div className="space-y-1">
                            {m.estimativaVariavel.porCategoria.map(cat => (
                              <div key={cat.categoriaId} className="flex justify-between items-center text-xs p-1.5 hover:bg-muted/50 rounded-md">
                                <span className="truncate max-w-[150px]">{cat.nome}</span>
                                <span className="font-medium text-amber-500/80">{formatCurrency(cat.media)}</span>
                              </div>
                            ))}
                            {m.estimativaVariavel.porCategoria.length === 0 && (
                              <div className="text-xs text-center text-muted-foreground py-2">
                                Sem histórico variável
                              </div>
                            )}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
                <td className="px-4 py-3 font-semibold text-rose-500 bg-rose-500/5">
                  -{formatCurrency(m.totalDespesasEstimadas ?? (m.despesasFixas + m.estimativaVariavel.valor))}
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
                            onClick={() => handleEditClick(m.mes, 'entrada', m.ajusteManual.entrada)}
                          >
                            +{formatCurrency(m.ajusteManual.entrada)}
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                            onClick={() => handleEditClick(m.mes, 'entrada', m.ajusteManual.entrada)}
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
                            onClick={() => handleEditClick(m.mes, 'saida', m.ajusteManual.saida)}
                          >
                            -{formatCurrency(m.ajusteManual.saida)}
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                            onClick={() => handleEditClick(m.mes, 'saida', m.ajusteManual.saida)}
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
