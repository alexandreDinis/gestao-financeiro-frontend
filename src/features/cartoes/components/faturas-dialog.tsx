"use client";

import { useFaturasQuery } from "../hooks/use-cartoes-query";
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
import { CheckCircle2, Clock, XCircle, ArrowLeft, ChevronRight, RefreshCcw, Layers, Zap, ExternalLink } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const statusColors: Record<StatusFatura, { border: string; text: string; bg: string; icon: React.ReactNode }> = {
  PAGA: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", icon: <CheckCircle2 size={12} className="mr-1" /> },
  FECHADA: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", icon: <Clock size={12} className="mr-1" /> },
  ABERTA: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", icon: <Clock size={12} className="mr-1" /> },
  ATRASADA: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", icon: <XCircle size={12} className="mr-1" /> },
};

const MESES = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function FaturaDetailView({
  fatura,
  cartao,
  onBack,
}: {
  fatura: FaturaCartao;
  cartao: CartaoCredito;
  onBack: () => void;
}) {
  const s = statusColors[fatura.status] || statusColors.ABERTA;

  return (
    <div className="flex flex-col h-full">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 shrink-0">
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">
            Fatura {MESES[fatura.mesReferencia]} {fatura.anoReferencia}
          </h3>
          <p className="text-xs text-muted-foreground">
            Vencimento: {fatura.dataVencimento.split('-').reverse().join('/')}
          </p>
        </div>
        <Badge variant="outline" className={`${s.bg} ${s.border} ${s.text} text-[10px] shrink-0`}>
          {s.icon} {fatura.status}
        </Badge>
      </div>

      {/* Resumo da fatura */}
      <div className="bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Valor Total da Fatura</p>
            <p className="text-2xl font-black text-white mt-1">{formatCurrency(fatura.valorTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">{fatura.parcelas.length} {fatura.parcelas.length === 1 ? 'lançamento' : 'lançamentos'}</p>
            {fatura.status !== 'PAGA' && (
              <Link
                href="/contas"
                className="inline-flex items-center gap-1.5 mt-2 text-[11px] text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <ExternalLink size={12} />
                Pagar em Contas a Pagar
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Resumo por Categoria - Visão Fintech */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 text-center group hover:bg-purple-500/10 transition-colors">
           <div className="flex justify-center mb-1">
              <RefreshCcw size={12} className="text-purple-400/50" />
           </div>
           <p className="text-[9px] text-purple-300/70 uppercase font-black tracking-widest mb-1">Recorrentes</p>
           <p className="text-lg font-black text-purple-400">{formatCurrency(fatura.totalRecorrente)}</p>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 text-center group hover:bg-blue-500/10 transition-colors">
           <div className="flex justify-center mb-1">
              <Layers size={12} className="text-blue-400/50" />
           </div>
           <p className="text-[9px] text-blue-300/70 uppercase font-black tracking-widest mb-1">Parcelados</p>
           <p className="text-lg font-black text-blue-400">{formatCurrency(fatura.totalParcelado)}</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-center group hover:bg-emerald-500/10 transition-colors">
           <div className="flex justify-center mb-1">
              <Zap size={12} className="text-emerald-400/50" />
           </div>
           <p className="text-[9px] text-emerald-300/70 uppercase font-black tracking-widest mb-1">Avulsos</p>
           <p className="text-lg font-black text-emerald-400">{formatCurrency(fatura.totalUnico)}</p>
        </div>
      </div>

      {/* Lista de parcelas agrupada */}
      <div className="flex-1 overflow-y-auto pr-1">
        {fatura.parcelas.length === 0 ? (
          <div className="text-center text-muted-foreground p-8 bg-black/20 rounded-lg border border-border/10">
            Nenhuma parcela encontrada nesta fatura.
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {/* 1. Recorrentes */}
            {fatura.parcelas.filter(p => p.totalParcelas <= 1 && fatura.totalRecorrente > 0).length > 0 && (
               <div className="space-y-2">
                 <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                       <RefreshCcw size={10} /> Assinaturas & Recorrentes
                    </p>
                    <span className="text-[10px] font-bold text-purple-400/50">{formatCurrency(fatura.totalRecorrente)}</span>
                 </div>
                 {fatura.parcelas
                   .filter(p => p.totalParcelas <= 1 && fatura.totalRecorrente > 0)
                   .map(p => <ParcelaItem key={p.id} parcela={p} icon={<RefreshCcw size={14} className="text-purple-400" />} color="purple" />)}
               </div>
            )}

            {/* 2. Parcelados */}
            {fatura.parcelas.filter(p => p.totalParcelas > 1).length > 0 && (
               <div className="space-y-2">
                 <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                       <Layers size={10} /> Compras Parceladas
                    </p>
                    <span className="text-[10px] font-bold text-blue-400/50">{formatCurrency(fatura.totalParcelado)}</span>
                 </div>
                 {fatura.parcelas
                   .filter(p => p.totalParcelas > 1)
                   .map(p => <ParcelaItem key={p.id} parcela={p} icon={<Layers size={14} className="text-blue-400" />} color="blue" />)}
               </div>
            )}

            {/* 3. Avulsos / Únicos */}
            {fatura.parcelas.filter(p => p.totalParcelas <= 1 && fatura.totalRecorrente <= 0).length > 0 && (
               <div className="space-y-2">
                 <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                       <Zap size={10} /> Compras Avulsas
                    </p>
                    <span className="text-[10px] font-bold text-emerald-400/50">{formatCurrency(fatura.totalUnico)}</span>
                 </div>
                 {fatura.parcelas
                   .filter(p => p.totalParcelas <= 1 && fatura.totalRecorrente <= 0)
                   .map(p => <ParcelaItem key={p.id} parcela={p} icon={<Zap size={14} className="text-emerald-400" />} color="emerald" />)}
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ParcelaItem({ parcela, icon, color }: { parcela: any, icon: React.ReactNode, color: string }) {
  const colorClasses: any = {
    purple: "bg-purple-500/10 border-purple-500/20",
    blue: "bg-blue-500/10 border-blue-500/20",
    emerald: "bg-emerald-500/10 border-emerald-500/20",
  };

  return (
    <div className="bg-black/20 border border-border/10 rounded-lg p-3.5 flex items-center justify-between gap-3 hover:border-border/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`p-1.5 rounded-lg border shrink-0 ${colorClasses[color] || 'bg-primary/10 border-primary/20'}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {parcela.descricaoTransacao || 'Sem descrição'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {parcela.totalParcelas > 1 ? `Parcela ${parcela.numeroParcela}/${parcela.totalParcelas}` : 'Lançamento único'}
            {' · '}Venc: {parcela.dataVencimento.split('-').reverse().join('/')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <p className="text-sm font-bold text-white">{formatCurrency(parcela.valorParcela)}</p>
        {parcela.paga ? (
          <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400 text-[9px] py-0 px-1.5">
            <CheckCircle2 size={10} className="mr-0.5" /> Paga
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400 text-[9px] py-0 px-1.5">
            <Clock size={10} className="mr-0.5" /> Pendente
          </Badge>
        )}
      </div>
    </div>
  );
}

export function FaturasDialog({ open, onOpenChange, cartao }: { open: boolean; onOpenChange: (open: boolean) => void; cartao: CartaoCredito }) {
  const { data: faturas, isLoading } = useFaturasQuery(cartao.id);

  const [selectedFaturaId, setSelectedFaturaId] = useState<number | null>(null);

  if (!cartao) return null;

  const selectedFatura = faturas?.find((f) => f.id === selectedFaturaId);

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) setSelectedFaturaId(null); }}>
      <DialogContent className="glass-panel border-border/40 sm:max-w-[750px] min-h-[500px] max-h-[85vh] overflow-hidden flex flex-col">
        {selectedFatura ? (
          // ===== DETALHE DA FATURA =====
          <FaturaDetailView
            fatura={selectedFatura}
            cartao={cartao}
            onBack={() => setSelectedFaturaId(null)}
          />
        ) : (
          // ===== LISTA DE FATURAS =====
          <>
            <DialogHeader>
              <DialogTitle>Faturas: {cartao.bandeira}</DialogTitle>
              <DialogDescription>
                Clique em uma fatura para ver os detalhes dos lançamentos.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-3">
              {isLoading ? (
                <div className="text-center text-muted-foreground p-8">Carregando faturas...</div>
              ) : faturas?.length === 0 ? (
                <div className="text-center text-muted-foreground p-8">Nenhuma fatura gerada para este cartão.</div>
              ) : (
                faturas?.toSorted((a, b) => b.anoReferencia - a.anoReferencia || b.mesReferencia - a.mesReferencia).map((fat) => {
                  const s = statusColors[fat.status] || statusColors.ABERTA;
                  return (
                    <div
                      key={fat.id}
                      onClick={() => setSelectedFaturaId(fat.id)}
                      className="bg-black/20 border border-border/20 rounded-lg p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-primary/40 hover:bg-white/[0.03] transition-all duration-200 group"
                    >
                      <div className="min-w-0">
                        <h4 className="text-base font-bold text-white mb-0.5">
                          {MESES[fat.mesReferencia]} {fat.anoReferencia}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Vencimento: {fat.dataVencimento.split('-').reverse().join('/')}
                          {' · '}{fat.parcelas.length} {fat.parcelas.length === 1 ? 'lançamento' : 'lançamentos'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-lg font-black text-white">{formatCurrency(fat.valorTotal)}</p>
                          <Badge variant="outline" className={`${s.bg} ${s.border} ${s.text} mt-1 text-[10px]`}>
                            {s.icon} {fat.status}
                          </Badge>
                        </div>

                        <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  );
                })
              )}

              {/* Link para Contas a Pagar */}
              <Link
                href="/contas"
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all duration-300 text-primary text-xs font-medium"
              >
                <ExternalLink size={14} />
                Pagar faturas em Contas a Pagar & Receber
              </Link>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
