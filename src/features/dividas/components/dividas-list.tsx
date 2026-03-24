"use client";

import { useState } from "react";
import { format } from "date-fns";
import { TipoDivida } from "../types";
import { useDividasQuery } from "../hooks/use-dividas-query";
import { useDeletarDividaMutation } from "../hooks/use-dividas-mutation";
import { DividaTimeline } from "./divida-timeline";
import { DividaFormDialog } from "./divida-form-dialog";
import { PagarParcelaDialog } from "./pagar-parcela-dialog";
import { DividaDetalhesDialog } from "./divida-detalhes-dialog";
import { Divida, ParcelaDivida } from "../types";
import { formatCurrency } from "@/lib/utils";
import { 
  MoreVertical, 
  Trash2, 
  Eye,
  PlusCircle,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface DividasListProps {
  tipo: TipoDivida;
}

export function DividasList({ tipo }: DividasListProps) {
  const { data: dividas, isLoading } = useDividasQuery(tipo);
  const deletarMutation = useDeletarDividaMutation();
  const [formOpen, setFormOpen] = useState(false);

  // States for new Sub-Dialogs
  const [pagarOpen, setPagarOpen] = useState(false);
  const [selectedParcela, setSelectedParcela] = useState<ParcelaDivida | null>(null);
  
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [selectedDivida, setSelectedDivida] = useState<Divida | null>(null);

  const handleDelete = (id: number) => {
    if (confirm("CUIDADO: Excluir esta dívida removerá todas as parcelas permanentemente. Continuar?")) {
      deletarMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isReceber = tipo === 'A_RECEBER';
  const emptyMessage = isReceber 
    ? "Nenhum dinheiro a receber registrado." 
    : "Nenhuma dívida a pagar registrada.";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isReceber ? 'bg-green-500' : 'bg-red-500'}`} />
          {isReceber ? "Listagem a Receber" : "Listagem a Pagar"}
        </h3>
        
        <Button onClick={() => setFormOpen(true)} className="bg-primary text-black hover:bg-primary/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          Registrar Operação
        </Button>
      </div>

      <div className="glass-panel rounded-xl border border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-black/20 border-b border-border/40">
              <tr>
                <th className="px-4 py-3 font-medium">Descrição / Pessoa</th>
                <th className="px-4 py-3 font-medium">Progressão (Timeline)</th>
                <th className="px-4 py-3 font-medium text-right">Valor Total</th>
                <th className="px-4 py-3 font-medium text-right">Restante</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {!dividas || dividas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground flex flex-col items-center justify-center">
                    <AlertCircle className="mb-2 text-muted-foreground/50 h-8 w-8" />
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                dividas.map((divida) => {
                  const percentualPago = divida.valorTotal > 0 
                    ? ((divida.valorTotal - divida.valorRestante) / divida.valorTotal) * 100 
                    : 0;

                  return (
                    <tr key={divida.id} className="border-b border-border/20 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white text-[15px]">{divida.pessoaNome}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold tracking-wider">Motivo</span>
                          {divida.descricao}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 px-1.5 py-0.5 bg-black/40 rounded w-fit">
                          Início: {format(new Date(divida.dataInicio), "dd/MM/yyyy")}
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-[200px]">
                        <DividaTimeline parcelas={divida.parcelas} dividaId={divida.id} />
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                         <span className={isReceber ? "text-green-500" : "text-white"}>
                           {formatCurrency(divida.valorTotal)}
                         </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                         <div className="font-bold text-white">
                           {formatCurrency(divida.valorRestante)}
                         </div>
                         <div className="text-[10px] text-muted-foreground">{percentualPago.toFixed(0)}% pago</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-panel border-border/40">
                            {(() => {
                               const pendentes = divida.parcelas.filter(p => p.status === 'PENDENTE' || p.status === 'ATRASADO');
                               pendentes.sort((a,b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());
                               const proxima = pendentes[0];
                               return proxima ? (
                                 <DropdownMenuItem className="cursor-pointer" onClick={() => {
                                   setSelectedParcela(proxima);
                                   setPagarOpen(true);
                                 }}>
                                   <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                                   <span>Pagar Próxima</span>
                                 </DropdownMenuItem>
                               ) : null;
                            })()}
                            <DropdownMenuItem className="cursor-pointer" onClick={() => {
                              setSelectedDivida(divida);
                              setDetalhesOpen(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>Ver Histórico e Detalhes</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/40" />
                            <DropdownMenuItem onClick={() => handleDelete(divida.id)} className="cursor-pointer text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Excluir Permanentemente</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DividaFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        tipoDefault={tipo}
      />

      <PagarParcelaDialog
        open={pagarOpen}
        onOpenChange={setPagarOpen}
        parcela={selectedParcela}
        tipo={tipo}
      />

      <DividaDetalhesDialog
        open={detalhesOpen}
        onOpenChange={setDetalhesOpen}
        divida={selectedDivida}
      />
    </div>
  );
}
