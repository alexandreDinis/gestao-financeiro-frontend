"use client";

import { useFaturasQuery, useFaturaQuery } from "../hooks/use-cartoes-query";
import { usePagarFaturaMutation } from "../hooks/use-cartoes-mutation";
import { CartaoCredito, FaturaCartao, StatusFatura } from "../types";
import { formatCurrency } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Check, XCircle, ArrowRight } from "lucide-react";
import { useState } from "react";

const statusColors: Record<StatusFatura, { border: string, text: string, bg: string, icon: React.ReactNode }> = {
  PAGA: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", icon: <CheckCircle2 size={12} className="mr-1" /> },
  FECHADA: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", icon: <Clock size={12} className="mr-1" /> },
  ABERTA: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", icon: <Clock size={12} className="mr-1" /> },
  ATRASADA: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", icon: <XCircle size={12} className="mr-1" /> },
};

export function FaturasDialog({ open, onOpenChange, cartao }: { open: boolean, onOpenChange: (open: boolean) => void, cartao: CartaoCredito }) {
  const { data: faturas, isLoading } = useFaturasQuery(cartao.id);
  const pagarMut = usePagarFaturaMutation();
  
  // For viewing parcels of a specific fatura
  const [selectedFaturaId, setSelectedFaturaId] = useState<number | null>(null);

  if (!cartao) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if(!val) setSelectedFaturaId(null); }}>
      <DialogContent className="glass-panel border-border/40 sm:max-w-[700px] min-h-[500px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Faturas: {cartao.bandeira}</DialogTitle>
          <DialogDescription>
            Histórico consolidado de notas a pagar do cartão associado à {cartao.contaNome}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-4">
          
          {isLoading ? (
            <div className="text-center text-muted-foreground p-8">Carregando faturas...</div>
          ) : faturas?.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">Nenhuma fatura gerada para este cartão.</div>
          ) : (
            <div className="space-y-4">
              {faturas?.toSorted((a,b) => b.anoReferencia - a.anoReferencia || b.mesReferencia - a.mesReferencia).map(fat => {
                const s = statusColors[fat.status] || statusColors.ABERTA;
                return (
                  <div key={fat.id} className="bg-black/20 border border-border/20 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-bold text-white mb-1">
                        Fatura {fat.mesReferencia.toString().padStart(2, '0')}/{fat.anoReferencia}
                      </h4>
                      <p className="text-xs text-muted-foreground">Vencimento: {fat.dataVencimento.split('-').reverse().join('/')}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-black text-white">{formatCurrency(fat.valorTotal)}</p>
                        <Badge variant="outline" className={`${s.bg} ${s.border} ${s.text} mt-1 text-[10px]`}>
                          {s.icon} {fat.status}
                        </Badge>
                      </div>

                      {fat.status !== 'PAGA' && fat.status !== 'ABERTA' && (
                        <Button 
                          onClick={() => pagarMut.mutate({ faturaId: fat.id, cartaoId: cartao.id })}
                          disabled={pagarMut.isPending}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="mr-1" size={14} /> Pagar
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
