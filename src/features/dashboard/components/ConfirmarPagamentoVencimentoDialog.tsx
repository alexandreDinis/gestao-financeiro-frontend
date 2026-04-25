"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { Check } from "lucide-react";

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
import { Conta, ApiResponse } from "@/types";

const pagarSchema = z.object({
  contaId: z.number().min(1, "Selecione uma conta"),
  valor: z.number().positive("O valor deve ser maior que zero"),
  dataPagamento: z.string().nonempty("Data é obrigatória"),
});

type PagarFormValues = z.infer<typeof pagarSchema>;

interface ConfirmarPagamentoVencimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vencimento: any | null;
}

export function ConfirmarPagamentoVencimentoDialog({ 
  open, 
  onOpenChange, 
  vencimento 
}: ConfirmarPagamentoVencimentoDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: contas } = useQuery({
    queryKey: ["contas"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Conta[]>>("/contas");
      return data.data;
    }
  });

  const { handleSubmit, control, reset, setValue, formState: { errors } } = useForm<PagarFormValues>({
    resolver: zodResolver(pagarSchema) as any,
    defaultValues: {
      dataPagamento: new Date().toISOString().split("T")[0],
    }
  });

  // Populate form when vencimento changes
  useEffect(() => {
    if (vencimento && open) {
      setValue("valor", vencimento.valor);
      
      // Try to find the account ID by name if possible, or leave to user
      if (contas && vencimento.conta) {
        const contaEncontrada = contas.find(c => c.nome === vencimento.conta);
        if (contaEncontrada) {
          setValue("contaId", contaEncontrada.id);
        }
      }
    }
  }, [vencimento, open, setValue, contas]);

  const onSubmit = async (data: PagarFormValues) => {
    if (!vencimento) return;

    setIsSubmitting(true);
    try {
      const idUnico = vencimento.idUnico || "";

      if (idUnico.startsWith("TRANSACAO-")) {
        await api.put(`/transacoes/${vencimento.transacaoId}/pagar`, {
          contaId: data.contaId,
          valor: data.valor,
          dataPagamento: data.dataPagamento
        });
      } else if (idUnico.startsWith("PARCELA-DIVIDA-")) {
        await api.put(`/dividas/parcelas/${vencimento.parcelaId}/pagar`, {
          contaId: data.contaId,
          valorPago: data.valor,
          dataPagamento: data.dataPagamento
        });
      } else if (idUnico.startsWith("FATURA-")) {
        await api.put(`/cartoes/faturas/${vencimento.parcelaId}/pagar`, {
          contaId: data.contaId,
          dataPagamento: data.dataPagamento
        });
      } else if (idUnico.startsWith("PARCELA-CARTAO-")) {
        toast.info("Parcelas de cartão são pagas através da fatura mensal.");
        setIsSubmitting(false);
        return;
      } else {
        toast.error("Tipo de vencimento não suportado para pagamento direto.");
        setIsSubmitting(false);
        return;
      }
      
      toast.success("Pagamento registrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["dashboard-v2"] });
      queryClient.invalidateQueries({ queryKey: ["vencimentos-todos"] });
      onOpenChange(false);
      reset();
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao registrar pagamento: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!vencimento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-border/40 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="text-green-500" size={20} />
            Confirmar Pagamento
          </DialogTitle>
          <DialogDescription>
            Ajuste o valor real e selecione a conta para confirmar o pagamento de:
            <strong className="block text-white mt-1">{vencimento.descricao}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          
          <div className="space-y-2">
            <Label>Valor Pago (R$)</Label>
            <Controller
              name="valor"
              control={control}
              render={({ field: { onChange, value } }) => (
                 <NumericFormat
                   value={value || ""}
                   thousandSeparator="."
                   decimalSeparator=","
                   prefix="R$ "
                   decimalScale={2}
                   fixedDecimalScale
                   allowNegative={false}
                   onValueChange={(values) => onChange(values.floatValue || 0)}
                   customInput={Input}
                   className={`bg-black/40 text-lg font-bold ${errors.valor ? 'border-red-500' : 'border-border/50'}`}
                   autoFocus
                 />
              )}
            />
            {errors.valor && <p className="text-red-400 text-xs">{errors.valor.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Conta / Banco</Label>
            <Controller
              name="contaId"
              control={control}
              render={({ field }) => (
                <Select 
                  onValueChange={(val) => field.onChange(val ? Number(val) : null)} 
                  value={field.value?.toString() || ""}
                >
                  <SelectTrigger className={`bg-black/40 ${errors.contaId ? 'border-red-500' : 'border-border/50'}`}>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel border-border/40">
                    {contas?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.contaId && <p className="text-red-400 text-xs">{errors.contaId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Data do Pagamento</Label>
            <Input
              type="date"
              className="bg-black/40 border-border/50"
              {...control.register("dataPagamento")}
            />
            {errors.dataPagamento && <p className="text-red-400 text-xs">{errors.dataPagamento.message}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-500 text-white px-8"
            >
              {isSubmitting ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
