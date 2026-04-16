"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { Conta, ApiResponse, TipoConta } from "@/types";
import { CartaoCredito, FaturaCartao } from "../types";
import { formatCurrency } from "@/lib/utils";
import { usePagarFaturaMutation } from "../hooks/use-cartoes-mutation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, CreditCard, Wallet, AlertTriangle } from "lucide-react";

interface PagarFaturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fatura: FaturaCartao | null;
  cartao: CartaoCredito;
}

const MESES = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function PagarFaturaDialog({ open, onOpenChange, fatura, cartao }: PagarFaturaDialogProps) {
  const pagarMut = usePagarFaturaMutation();

  const [contaId, setContaId] = useState<string>("");
  const [dataPagamento, setDataPagamento] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [showSaldoDialog, setShowSaldoDialog] = useState(false);
  const [saldoInfo, setSaldoInfo] = useState<{
    saldoAtual: number;
    valorOperacao: number;
    nomeConta: string;
  } | null>(null);

  const { data: contas } = useQuery({
    queryKey: ["contas"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Conta[]>>("/contas");
      return data.data;
    },
    enabled: open,
  });

  // Auto-seleciona primeira conta quando as contas carregam
  useEffect(() => {
    if (contas && contas.length > 0 && !contaId) {
      // Filtra para não mostrar contas de cartão de crédito como opção de pagamento
      const contasCorrente = contas.filter((c) => c.tipo !== TipoConta.CARTAO_CREDITO);
      if (contasCorrente.length > 0) {
        setContaId(String(contasCorrente[0].id));
      } else {
        setContaId(String(contas[0].id));
      }
    }
  }, [contas, contaId]);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setContaId("");
      setDataPagamento(new Date().toISOString().split("T")[0]);
    }
  }, [open]);

  const contasDisponiveis = contas?.filter((c) => c.tipo !== TipoConta.CARTAO_CREDITO) ?? contas ?? [];

  const handleConfirmar = async () => {
    if (!fatura || !contaId) return;

    try {
      await pagarMut.mutateAsync({
        faturaId: fatura.id,
        cartaoId: cartao.id,
        contaId: Number(contaId),
        dataPagamento,
      });
      onOpenChange(false);
    } catch (err: any) {
      const apiError = err.response?.data?.errors?.[0];
      if (apiError?.code === "INSUFFICIENT_BALANCE") {
        setSaldoInfo({
          saldoAtual: apiError.details.saldoAtual,
          valorOperacao: apiError.details.valorOperacao,
          nomeConta: apiError.details.nomeConta,
        });
        setShowSaldoDialog(true);
      }
      // Outros erros são tratados pelo Toast global no hook
    }
  };

  const contaSelecionada = contasDisponiveis.find((c) => String(c.id) === contaId);
  const saldoDisponivel = contaSelecionada?.saldoAtual ?? 0;
  const saldoSuficiente = saldoDisponivel >= (fatura?.valorTotal ?? 0);

  if (!fatura) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-border/40 sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard size={18} className="text-primary" />
            Pagar Fatura
          </DialogTitle>
          <DialogDescription>
            Confirme de qual conta será debitado o pagamento da fatura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Resumo da fatura */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">
              {cartao.bandeira} · {MESES[fatura.mesReferencia]} {fatura.anoReferencia}
            </p>
            <p className="text-2xl font-black text-white">{formatCurrency(fatura.valorTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Vencimento: {fatura.dataVencimento.split('-').reverse().join('/')}
            </p>
          </div>

          {/* Seleção de conta */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Wallet size={14} className="text-muted-foreground" />
              Débitar da conta
            </Label>
            <Select value={contaId} onValueChange={(val) => setContaId(val ?? "")}>
              <SelectTrigger className="bg-black/40 border-border/50">
                <SelectValue placeholder="Selecione a conta de pagamento...">
                  {contaSelecionada ? contaSelecionada.nome : "Selecione uma conta"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="glass-panel border-border/40">
                {contasDisponiveis.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    <div className="flex items-center justify-between w-full min-w-[300px]">
                      <span>{c.nome}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">
                        R$ {c.saldoAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {contaId && (
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] text-muted-foreground">
                  Saldo disponível na conta:
                </p>
                <p className={`text-xs font-bold ${
                  !saldoSuficiente ? "text-red-400" : "text-green-400"
                }`}>
                  R$ {saldoDisponivel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}

            {!contaId && (
              <p className="text-red-400 text-xs">Selecione uma conta para continuar.</p>
            )}

            {contaId && !saldoSuficiente && (
              <div className="bg-red-500/10 border border-red-500/20 rounded p-2 mt-2">
                <p className="text-[10px] text-red-400 leading-tight">
                  ⚠️ <strong>Saldo insuficiente.</strong> O pagamento poderá ser rejeitado pelo sistema ou deixar sua conta negativa.
                </p>
              </div>
            )}
          </div>

          {/* Data do pagamento */}
          <div className="space-y-2">
            <Label>Data do Pagamento</Label>
            <Input
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="bg-black/40 border-border/50"
            />
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-transparent border-border/50 hover:bg-white/5"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={pagarMut.isPending || !contaId}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {pagarMut.isPending ? (
              "Processando..."
            ) : (
              <>
                <Check className="mr-1" size={14} />
                Confirmar Pagamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Diálogo de Aviso: Saldo Insuficiente */}
    <Dialog open={showSaldoDialog} onOpenChange={setShowSaldoDialog}>
      <DialogContent className="glass-panel border-red-500/30 sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-red-500/20 text-red-500">
              <AlertTriangle size={20} />
            </div>
            <DialogTitle className="text-white text-lg font-bold">Saldo Insuficiente</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground pt-1">
            Sua conta <strong>{saldoInfo?.nomeConta}</strong> não possui saldo suficiente para liquidar esta fatura agora.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Saldo atual:</span>
            <span className="text-white font-medium">{formatCurrency(saldoInfo?.saldoAtual ?? 0)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Valor da fatura:</span>
            <span className="text-white font-medium">{formatCurrency(saldoInfo?.valorOperacao ?? 0)}</span>
          </div>
          <div className="h-px bg-white/10 w-full" />
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-semibold">Impacto no saldo:</span>
            <span className="text-red-400 font-bold">
              {formatCurrency((saldoInfo?.saldoAtual ?? 0) - (saldoInfo?.valorOperacao ?? 0))}
            </span>
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-[11px] text-red-400 leading-snug">
          O sistema bloqueou o pagamento para evitar saldo negativo indesejado. Adicione saldo à conta ou escolha outra forma de pagamento.
        </div>

        <DialogFooter className="mt-4">
          <Button 
            onClick={() => setShowSaldoDialog(false)}
            className="w-full bg-white/10 hover:bg-white/20 border-white/10 text-white"
          >
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
