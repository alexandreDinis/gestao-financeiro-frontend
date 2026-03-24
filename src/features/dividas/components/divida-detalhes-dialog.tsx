"use client";

import { format } from "date-fns";
import { Divida, StatusTransacao } from "../types";
import { formatCurrency } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

interface DividaDetalhesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  divida: Divida | null;
}

const statusColors: Record<StatusTransacao, { border: string, text: string, bg: string, icon: React.ReactNode }> = {
  PAGO: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", icon: <CheckCircle2 size={12} className="mr-1" /> },
  PENDENTE: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", icon: <Clock size={12} className="mr-1" /> },
  ATRASADO: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", icon: <XCircle size={12} className="mr-1" /> },
  CANCELADO: { bg: "bg-muted", border: "border-muted-foreground/30", text: "text-muted-foreground", icon: <XCircle size={12} className="mr-1" /> }
};

export function DividaDetalhesDialog({ open, onOpenChange, divida }: DividaDetalhesDialogProps) {
  if (!divida) return null;

  const isReceber = divida.tipo === "A_RECEBER";
  
  // Sort parcelas by ID to keep the chronological / split order
  const parcelasOrdenadas = [...divida.parcelas].sort((a, b) => a.id - b.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-border/40 sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Deatlhes da Operação</DialogTitle>
          <DialogDescription>
            Histórico completo de pagamentos e parcelas pendentes com {divida.pessoaNome}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 my-2 p-4 bg-black/20 rounded-lg border border-border/20">
           <div>
             <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Valor Total Original</p>
             <p className={`text-xl font-bold ${isReceber ? 'text-green-400' : 'text-primary'}`}>
               {formatCurrency(divida.valorTotal)}
             </p>
           </div>
           <div className="text-right">
             <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Saldo Restante</p>
             <p className="text-xl font-bold text-white">
               {formatCurrency(divida.valorRestante)}
             </p>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 mt-2 space-y-4">
          <h4 className="text-sm font-medium text-white flex items-center gap-2">
            Histórico e Previsões ({parcelasOrdenadas.length})
          </h4>
          
          <div className="border border-border/20 rounded-lg overflow-hidden bg-black/10">
            <Table>
              <TableHeader className="bg-black/20">
                <TableRow className="border-border/10 hover:bg-transparent">
                  <TableHead className="w-[100px]">Parcela</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parcelasOrdenadas.map((p, index) => {
                  const sColors = statusColors[p.status] || statusColors.PENDENTE;
                  return (
                    <TableRow key={p.id} className="border-border/10">
                      <TableCell className="font-medium text-muted-foreground">
                        {p.numeroParcela}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-white">{format(new Date(p.dataVencimento), "dd/MM/yyyy")}</span>
                          {p.dataPagamento && (
                            <span className="text-[10px] text-muted-foreground">Pago: {format(new Date(p.dataPagamento), "dd/MM/yyyy")}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${sColors.bg} ${sColors.border} ${sColors.text} flex w-fit items-center text-[10px]`}>
                          {sColors.icon}
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-white">
                        {formatCurrency(p.valor)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
