"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { NumericFormat } from "react-number-format";
import { useCreateTransacao } from "@/hooks/use-transacoes";

import { TipoTransacao, Conta, Categoria, ApiResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, CalendarIcon } from "lucide-react";

// 1. Zod Validation Schema
const transacaoSchema = z.object({
  descricao: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
  valor: z.number().positive("O valor deve ser maior que zero"),
  data: z.string().nonempty("Data é obrigatória"),
  dataVencimento: z.string().optional(),
  tipo: z.nativeEnum(TipoTransacao),
  categoriaId: z.number().optional().nullable(),
  contaOrigemId: z.number({ required_error: "Conta origem é obrigatória" }).min(1, "Selecione uma conta"),
  contaDestinoId: z.number().optional().nullable(),
  observacao: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.tipo === TipoTransacao.TRANSFERENCIA && !data.contaDestinoId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Conta de destino é obrigatória para transferências",
      path: ["contaDestinoId"],
    });
  }
  if (data.tipo !== TipoTransacao.TRANSFERENCIA && !data.categoriaId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Categoria é obrigatória para receitas/despesas",
      path: ["categoriaId"],
    });
  }
});

type TransacaoFormValues = z.infer<typeof transacaoSchema>;

export function TransacaoForm({ onSuccess }: { onSuccess: () => void }) {
  const createMutation = useCreateTransacao();

  // 2. Fetch dependencies (Contas & Categorias)
  const { data: fetchContas } = useQuery({
    queryKey: ["contas"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Conta[]>>("/contas");
      return data.data;
    }
  });

  const { data: fetchCategorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Categoria[]>>("/categorias");
      return data.data;
    }
  });

  const contas = fetchContas || [];
  const categorias = fetchCategorias || [];

  // 3. React Hook Form
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransacaoFormValues>({
    resolver: zodResolver(transacaoSchema),
    defaultValues: {
      tipo: TipoTransacao.DESPESA,
      data: new Date().toISOString().split("T")[0],
      descricao: "",
      valor: 0,
    },
  });

  const tipoSelecionado = watch("tipo");
  const isTransferencia = tipoSelecionado === TipoTransacao.TRANSFERENCIA;

  // 4. Submit Handler
  const onSubmit = async (data: TransacaoFormValues) => {
    try {
      // Ensure nulls instead of undefined for backend
      const payload = {
        ...data,
        categoriaId: isTransferencia ? null : data.categoriaId,
        contaDestinoId: isTransferencia ? data.contaDestinoId : null,
      };
      
      await createMutation.mutateAsync(payload);
      reset();
      onSuccess();
    } catch (e) {
      console.error("Form error:", e);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
      
      {/* Type Selector */}
      <div className="grid grid-cols-3 gap-2">
         {[TipoTransacao.DESPESA, TipoTransacao.RECEITA, TipoTransacao.TRANSFERENCIA].map((t) => (
           <label 
             key={t}
             className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
               tipoSelecionado === t 
                 ? t === TipoTransacao.DESPESA ? 'bg-red-500/20 border-red-500' 
                 : t === TipoTransacao.RECEITA ? 'bg-green-500/20 border-green-500'
                 : 'bg-blue-500/20 border-blue-500'
                 : 'bg-black/30 border-border/40 hover:bg-white/5'
             }`}
           >
             <input type="radio" value={t} {...register("tipo")} className="sr-only" />
             {t === TipoTransacao.DESPESA && <ArrowDownRight size={20} className={tipoSelecionado === t ? 'text-red-400' : 'text-muted-foreground'} />}
             {t === TipoTransacao.RECEITA && <ArrowUpRight size={20} className={tipoSelecionado === t ? 'text-green-400' : 'text-muted-foreground'} />}
             {t === TipoTransacao.TRANSFERENCIA && <ArrowLeftRight size={20} className={tipoSelecionado === t ? 'text-blue-400' : 'text-muted-foreground'} />}
             <span className={`text-xs mt-1 font-medium ${tipoSelecionado === t ? 'text-white' : 'text-muted-foreground'}`}>
               {t === TipoTransacao.DESPESA ? 'Despesa' : t === TipoTransacao.RECEITA ? 'Receita' : 'Transferência'}
             </span>
           </label>
         ))}
      </div>

      {/* Description & Value */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Input
            id="descricao"
            placeholder="Ex: Almoço, Salário, Compra..."
            autoFocus
            className={`bg-black/40 border-border/50 ${errors.descricao ? 'border-red-500/50' : ''}`}
            {...register("descricao")}
          />
          {errors.descricao && <p className="text-red-400 text-xs mt-1">{errors.descricao.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$)</Label>
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
                className={`bg-black/40 text-lg font-medium border-border/50 ${
                  tipoSelecionado === TipoTransacao.DESPESA ? 'text-red-400' :
                  tipoSelecionado === TipoTransacao.RECEITA ? 'text-green-400' : 'text-blue-400'
                } ${errors.valor ? 'border-red-500/50' : ''}`}
                placeholder="R$ 0,00"
              />
            )}
          />
          {errors.valor && <p className="text-red-400 text-xs mt-1">{errors.valor.message}</p>}
        </div>
      </div>

      {/* Dynamic Accounts & Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Origin Account (Always shown) */}
        <div className="space-y-2">
          <Label>{isTransferencia ? "Conta de Origem" : "Conta"}</Label>
          <Controller
            name="contaOrigemId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value?.toString() || ""}>
                <SelectTrigger className={`bg-black/40 border-border/50 ${errors.contaOrigemId ? 'border-red-500/50' : ''}`}>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent className="glass-panel border-border/40 max-h-[200px]">
                  {contas.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.contaOrigemId && <p className="text-red-400 text-xs mt-1">{errors.contaOrigemId.message}</p>}
        </div>

        {/* Dynamic Second Field: Destination Account or Category */}
        <div className="space-y-2">
          <Label>{isTransferencia ? "Conta de Destino" : "Categoria"}</Label>
          
          {isTransferencia ? (
            // Transfer Destination
            <Controller
              name="contaDestinoId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value?.toString() || ""}>
                  <SelectTrigger className={`bg-black/40 border-border/50 ${errors.contaDestinoId ? 'border-red-500/50' : ''}`}>
                    <SelectValue placeholder="Selecione a conta destino" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel border-border/40 max-h-[200px]">
                    {contas.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          ) : (
            // Category for Receita/Despesa
            <Controller
              name="categoriaId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value?.toString() || ""}>
                  <SelectTrigger className={`bg-black/40 border-border/50 ${errors.categoriaId ? 'border-red-500/50' : ''}`}>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel border-border/40 max-h-[200px]">
                    {categorias.filter(c => c.tipo === tipoSelecionado).map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}

          {errors.contaDestinoId && isTransferencia && <p className="text-red-400 text-xs mt-1">{errors.contaDestinoId.message}</p>}
          {errors.categoriaId && !isTransferencia && <p className="text-red-400 text-xs mt-1">{errors.categoriaId.message}</p>}
        </div>

      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="space-y-2 relative">
            <Label htmlFor="data">Data do Lançamento</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="data"
                type="date"
                className={`bg-black/40 border-border/50 pl-10 ${errors.data ? 'border-red-500/50' : ''}`}
                {...register("data")}
              />
            </div>
            {errors.data && <p className="text-red-400 text-xs mt-1">{errors.data.message}</p>}
         </div>

         <div className="space-y-2 relative">
            <Label htmlFor="dataVencimento">Vencimento (Opcional)</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="dataVencimento"
                type="date"
                className="bg-black/40 border-border/50 pl-10"
                {...register("dataVencimento")}
              />
            </div>
         </div>
      </div>

      {/* Form Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => { reset(); onSuccess(); }}
          className="bg-transparent border-border/50 hover:bg-white/5"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || createMutation.isPending}
          className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(var(--primary),0.4)]"
        >
          {isSubmitting || createMutation.isPending ? "Salvando..." : "Salvar Lançamento"}
        </Button>
      </div>
    </form>
  );
}
