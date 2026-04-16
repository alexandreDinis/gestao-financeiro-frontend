"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useCriarCartaoMutation, useEditarCartaoMutation } from "../hooks/use-cartoes-mutation";
import { CartaoCredito } from "../types";
import { NumericFormat } from "react-number-format";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const cartaoSchema = z.object({
  nomeCartao: z.string().min(2, "O nome do cartão é obrigatório"),
  bandeira: z.string().min(2, "Bandeira é obrigatória"),
  limite: z.number().positive("Limite deve ser maior que zero"),
  diaFechamento: z.number().min(1).max(31),
  diaVencimento: z.number().min(1).max(31),
});

type CartaoFormValues = z.infer<typeof cartaoSchema>;

interface CartaoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartaoParaEditar?: CartaoCredito;
}

export function CartaoFormDialog({ open, onOpenChange, cartaoParaEditar }: CartaoFormDialogProps) {
  const mutacaoCriar = useCriarCartaoMutation();
  const mutacaoEditar = useEditarCartaoMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CartaoFormValues>({
    resolver: zodResolver(cartaoSchema) as any,
    defaultValues: {
      nomeCartao: cartaoParaEditar?.contaNome || "",
      bandeira: cartaoParaEditar?.bandeira || "Mastercard",
      limite: cartaoParaEditar?.limiteTotal || 0,
      diaFechamento: cartaoParaEditar?.diaFechamento || 25,
      diaVencimento: cartaoParaEditar?.diaVencimento || 5,
    },
  });

  const limiteVal = watch("limite");

  const onSubmit = async (data: CartaoFormValues) => {
    if (cartaoParaEditar) {
      await mutacaoEditar.mutateAsync({ id: cartaoParaEditar.id, data });
    } else {
      await mutacaoCriar.mutateAsync(data);
    }
    onOpenChange(false);
  };

  const isSaving = mutacaoCriar.isPending || mutacaoEditar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-border/40 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{cartaoParaEditar ? "Editar Cartão de Crédito" : "Novo Cartão de Crédito"}</DialogTitle>
          <DialogDescription>
            {cartaoParaEditar ? "Atualize as informações do seu cartão corporativo/pessoal." : "Crie um novo cartão de crédito para consolidar os lançamentos em faturas fechadas."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          
          <div className="space-y-2">
            <Label>Nome de Exibição do Cartão</Label>
            <Input placeholder="Ex: Cartão Nubank" className={`bg-black/40 border-border/50 ${errors.nomeCartao ? 'border-red-500/50' : ''}`} {...register("nomeCartao")} />
            {errors.nomeCartao && <p className="text-red-400 text-xs mt-1">{errors.nomeCartao.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Bandeira</Label>
               <Input placeholder="Mastercard, Visa..." className={`bg-black/40 border-border/50 ${errors.bandeira ? 'border-red-500/50' : ''}`} {...register("bandeira")} />
               {errors.bandeira && <p className="text-red-400 text-xs mt-1">{errors.bandeira.message}</p>}
             </div>
             
             <div className="space-y-2">
               <Label>Limite do Cartão</Label>
               <NumericFormat
                 value={limiteVal || ""}
                 thousandSeparator="."
                 decimalSeparator=","
                 prefix="R$ "
                 decimalScale={2}
                 fixedDecimalScale
                 allowNegative={false}
                 onValueChange={(values) => setValue("limite", values.floatValue || 0)}
                 customInput={Input}
                 className={`bg-black/40 text-primary font-medium border-border/50 ${errors.limite ? 'border-red-500/50' : ''}`}
                 placeholder="R$ 0,00"
               />
               {errors.limite && <p className="text-red-400 text-xs mt-1">{errors.limite.message}</p>}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dia de Fechamento</Label>
              <Input type="number" min="1" max="31" className={`bg-black/40 border-border/50 ${errors.diaFechamento ? 'border-red-500/50' : ''}`} {...register("diaFechamento", { valueAsNumber: true })} />
              {errors.diaFechamento && <p className="text-red-400 text-xs mt-1">{errors.diaFechamento.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Dia de Vencimento</Label>
              <Input type="number" min="1" max="31" className={`bg-black/40 border-border/50 ${errors.diaVencimento ? 'border-red-500/50' : ''}`} {...register("diaVencimento", { valueAsNumber: true })} />
              {errors.diaVencimento && <p className="text-red-400 text-xs mt-1">{errors.diaVencimento.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent border-border/50 hover:bg-white/5">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Cartão"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
