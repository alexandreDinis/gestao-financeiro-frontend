"use client";

import { useState } from "react";
import { format } from "date-fns";
import { TipoDivida } from "../types";
import { useDividasQuery } from "../hooks/use-dividas-query";
import { useDeletarDividaMutation, useProcessarRecorrenciasMutation } from "../hooks/use-dividas-mutation";
import { DividaTimeline } from "./divida-timeline";
import { DividaFormDialog } from "./divida-form-dialog";
import { PagarParcelaDialog } from "./pagar-parcela-dialog";
import { PagarLoteDialog } from "./pagar-lote-dialog";
import { PagarLoteMesDialog } from "./pagar-lote-mes-dialog";
import { DividaDetalhesDialog } from "./divida-detalhes-dialog";
import { DividaFilters } from "./divida-filters";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Divida, ParcelaDivida, StatusDivida } from "../types";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  MoreVertical, 
  Trash2, 
  Eye,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Filter,
  FileText,
  Layers,
  Wallet,
  RefreshCw
} from "lucide-react";
import { DividasService } from "../services/dividas.service";
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
  const [pessoaId, setPessoaId] = useState<number | undefined>();
  const [ano, setAno] = useState<number | undefined>();
  const [mes, setMes] = useState<number | undefined>();
  const [status, setStatus] = useState<StatusDivida | undefined>();

  const { data: resumo, isLoading } = useDividasQuery(tipo, pessoaId, ano, mes, status);
  const dividas = resumo?.items || [];
  const totalGeral = resumo?.totalGeral || 0;

  const deletarMutation = useDeletarDividaMutation();
  const processarRecorrenciasMutation = useProcessarRecorrenciasMutation();
  const [formOpen, setFormOpen] = useState(false);

  // States for new Sub-Dialogs
  const [pagarOpen, setPagarOpen] = useState(false);
  const [selectedParcela, setSelectedParcela] = useState<ParcelaDivida | null>(null);
  
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [selectedDivida, setSelectedDivida] = useState<Divida | null>(null);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [dividaToDelete, setDividaToDelete] = useState<number | null>(null);

  const [loteOpen, setLoteOpen] = useState(false);
  const [loteDivida, setLoteDivida] = useState<Divida | null>(null);

  const [loteMesOpen, setLoteMesOpen] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      await DividasService.exportarPdf(tipo, pessoaId, ano, mes, status);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = (id: number) => {
    setDividaToDelete(id);
    setConfirmDeleteOpen(true);
  };

  const onConfirmDelete = () => {
    if (dividaToDelete) {
      deletarMutation.mutate(dividaToDelete);
      setConfirmDeleteOpen(false);
    }
  };

  const clearFilters = () => {
    setPessoaId(undefined);
    setAno(undefined);
    setMes(undefined);
    setStatus(undefined);
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

  const isFiltradoMes = !!(ano && mes);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isReceber ? 'bg-green-500' : 'bg-red-500'}`} />
          {isReceber ? "Listagem a Receber" : "Listagem a Pagar"}
        </h3>
        
        <div className="flex gap-2">
          {isFiltradoMes && dividas.some(d => d.parcelas.some(p => p.status !== 'PAGO' && p.status !== 'CANCELADO')) && (
            <Button 
              variant="outline" 
              onClick={() => setLoteMesOpen(true)}
              className="border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-400 transition-all shadow-lg shadow-green-500/5"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {isReceber ? 'Receber Todas do Mês' : 'Pagar Todas do Mês'}
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => processarRecorrenciasMutation.mutate()} 
            disabled={processarRecorrenciasMutation.isPending}
            className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary transition-all shadow-lg shadow-primary/5"
            title="Atualiza e gera as parcelas das dívidas recorrentes que deveriam vencer hoje"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${processarRecorrenciasMutation.isPending ? 'animate-spin' : ''}`} />
            Atualizar Recorrentes
          </Button>

          <Button 
            variant="outline" 
            onClick={handleExportPdf} 
            disabled={isExporting || dividas.length === 0}
            className="border-primary/50 text-white hover:bg-white/10 hover:text-white transition-all shadow-lg shadow-white/5"
          >
            {isExporting ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Gerar Extrato PDF
          </Button>

          <Button onClick={() => setFormOpen(true)} className="bg-primary text-black hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            Registrar Operação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        <div className="lg:col-span-4 glass-panel p-5 rounded-xl border border-border/40 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Filter className="h-12 w-12" />
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 font-semibold">
             {isFiltradoMes ? `Total no mês (${mes}/${ano})` : "Valor Total Restante"}
          </div>
          <div className={`text-3xl font-bold tracking-tight ${isReceber ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(totalGeral)}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isReceber ? 'bg-green-500' : 'bg-red-500'}`} />
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
              {pessoaId ? "Filtrado por contato" : "Visualização consolidada"}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-8 glass-panel p-5 rounded-xl border border-border/40 flex items-center bg-black/5">
           <DividaFilters 
             pessoaId={pessoaId}
             onPessoaChange={setPessoaId}
             ano={ano}
             onAnoChange={setAno}
             mes={mes}
             onMesChange={setMes}
             status={status}
             onStatusChange={setStatus}
             onClear={clearFilters}
           />
        </div>
      </div>

      <div className="glass-panel rounded-xl border border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-black/20 border-b border-border/40">
              <tr>
                <th className="px-4 py-3 font-medium">Descrição / Pessoa</th>
                <th className="px-4 py-3 font-medium">Progressão (Timeline)</th>
                <th className="px-4 py-3 font-medium text-right">{isFiltradoMes ? "Valor no Mês" : "Valor Total"}</th>
                <th className="px-4 py-3 font-medium text-right">{isFiltradoMes ? "Situação Mês" : "Restante"}</th>
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
                  
                  const valorNoMes = divida.parcelas.reduce((acc, p) => acc + p.valor, 0);

                  return (
                    <tr key={divida.id} className="border-b border-border/20 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white text-[15px]">{divida.pessoaNome}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          {divida.descricao}
                        </div>
                        {isFiltradoMes ? (
                           <div className="text-[10px] text-muted-foreground mt-1 px-1.5 py-0.5 bg-black/40 rounded w-fit">
                             Dívida Principal: {formatCurrency(divida.valorRestante)} restante
                           </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground mt-1 px-1.5 py-0.5 bg-black/40 rounded w-fit">
                            Início: {format(new Date(divida.dataInicio), "dd/MM/yyyy")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 min-w-[200px]">
                        <DividaTimeline 
                          parcelas={divida.parcelas} 
                          totalParcelas={divida.totalParcelas}
                          dividaId={divida.id} 
                          onPagar={(p) => {
                            setSelectedParcela(p);
                            setPagarOpen(true);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                         <div className={cn("text-lg", isReceber ? "text-green-500" : "text-white")}>
                            {formatCurrency(isFiltradoMes ? valorNoMes : divida.valorTotal)}
                         </div>
                         {isFiltradoMes && (
                           <div className="text-[10px] text-muted-foreground">Parcela do Extrato</div>
                         )}
                      </td>
                        <td className="px-4 py-3 text-right">
                          {isFiltradoMes ? (
                            <>
                              <div className={cn("font-bold", divida.parcelas.every(p => p.status === 'PAGO') ? 'text-green-500' : 'text-white')}>
                                {divida.parcelas.length > 0 && (
                                  <span className="text-muted-foreground/60 font-medium text-[10px] mr-1.5 align-middle">
                                    {divida.parcelas[0].numeroParcela}/{divida.totalParcelas}
                                  </span>
                                )}
                                <span className="align-middle">
                                  {divida.parcelas.every(p => p.status === 'PAGO') ? 'Liquidado' : 'Pendente'}
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground">Este mês</div>
                            </>
                         ) : (
                           <>
                             <div className="font-bold text-white">
                               {formatCurrency(divida.valorRestante)}
                             </div>
                             <div className="text-[10px] text-muted-foreground">{percentualPago.toFixed(0)}% pago</div>
                           </>
                         )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            }
                          />
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
                                   <span>{isReceber ? 'Receber Próxima' : 'Pagar Próxima'}</span>
                                 </DropdownMenuItem>
                               ) : null;
                            })()}
                            {(() => {
                               const pendentes = divida.parcelas.filter(p => p.status === 'PENDENTE' || p.status === 'ATRASADO');
                               return pendentes.length >= 1 ? (
                                 <DropdownMenuItem className="cursor-pointer" onClick={() => {
                                   setLoteDivida(divida);
                                   setLoteOpen(true);
                                 }}>
                                   <Layers className="mr-2 h-4 w-4 text-primary" />
                                   <span>{isReceber ? 'Receber em Lote' : 'Pagar em Lote'} ({pendentes.length})</span>
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

      <PagarLoteDialog
        open={loteOpen}
        onOpenChange={setLoteOpen}
        divida={loteDivida}
        tipo={tipo}
      />

      <PagarLoteMesDialog
        open={loteMesOpen}
        onOpenChange={setLoteMesOpen}
        dividas={dividas}
        tipo={tipo}
        mes={mes}
        ano={ano}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Excluir Dívida Permanentemente?"
        description="Esta ação não pode ser desfeita. Todas as parcelas e o histórico vinculado serão removidos."
        onConfirm={onConfirmDelete}
        confirmText="Excluir Agora"
        variant="danger"
        isLoading={deletarMutation.isPending}
      />
    </div>
  );
}
