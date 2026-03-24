"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { NumericFormat } from "react-number-format";
import { useCreateTransacao, useCreateTransacaoRecorrente } from "@/hooks/use-transacoes";
import { useCartoesQuery } from "@/features/cartoes/hooks/use-cartoes-query";
import { useCompraCartaoMutation } from "@/features/cartoes/hooks/use-cartoes-mutation";

import { TipoTransacao, Conta, Categoria, ApiResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, CalendarIcon, Repeat, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

// 1. Zod Validation Schema
const transacaoSchema = z.object({
  descricao: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
  valor: z.number().positive("O valor deve ser maior que zero"),
  data: z.string().nonempty("Data é obrigatória"),
  dataVencimento: z.string().optional(),
  tipo: z.nativeEnum(TipoTransacao),
  tipoDespesa: z.enum(["FIXA", "VARIAVEL"]).optional().nullable(),
  categoriaId: z.number().optional().nullable(),
  contaOrigemId: z.number().min(1, "Selecione uma conta"),
  contaDestinoId: z.number().optional().nullable(),
  observacao: z.string().optional(),
  
  // Recurrence fields
  isRecorrente: z.boolean().optional(),
  periodicidade: z.enum(["DIARIA", "SEMANAL", "QUINZENAL", "MENSAL", "ANUAL"]).optional().nullable(),
  dataFim: z.string().optional(),
  
  // Credit Card fields
  parcelas: z.number().min(1).optional(),
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
  if (data.isRecorrente && !data.periodicidade) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Periodicidade é obrigatória para transações recorrentes",
      path: ["periodicidade"],
    });
  }
});

type TransacaoFormValues = z.infer<typeof transacaoSchema>;

export function TransacaoForm({ onSuccess }: { onSuccess: () => void }) {
  const createMutation = useCreateTransacao();
  const createRecorrenteMutation = useCreateTransacaoRecorrente();
  const compraCartaoMutation = useCompraCartaoMutation();

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

  const { data: fetchCartoes } = useCartoesQuery();

  const contas = fetchContas || [];
  const categorias = fetchCategorias || [];
  const cartoes = fetchCartoes || [];

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
      isRecorrente: false,
    },
  });

  const [openOrigem, setOpenOrigem] = useState(false);
  const [openDestino, setOpenDestino] = useState(false);
  const [openCategoria, setOpenCategoria] = useState(false);

  const [searchOrigem, setSearchOrigem] = useState("");
  const [searchDestino, setSearchDestino] = useState("");
  const [searchCategoria, setSearchCategoria] = useState("");

  const tipoSelecionado = watch("tipo");
  const contaOrigemSelecionada = watch("contaOrigemId");
  const isTransferencia = tipoSelecionado === TipoTransacao.TRANSFERENCIA;
  const isDespesa = tipoSelecionado === TipoTransacao.DESPESA;
  const isRecorrente = watch("isRecorrente");
  
  const isCartao = cartoes.some(c => c.contaId === contaOrigemSelecionada);

  // 4. Submit Handler
  const onSubmit = async (data: TransacaoFormValues) => {
    try {
      const cartaoCorrespondente = cartoes.find(c => c.contaId === data.contaOrigemId);

      if (data.isRecorrente) {
        // Enviar para API de recorrências (Suporta agora Cartão ou Conta Normal)
        const diaDoMes = new Date(data.data + "T12:00:00Z").getDate();
        
        const payload = {
          descricao: data.descricao,
          valor: data.valor,
          tipo: data.tipo,
          periodicidade: data.periodicidade,
          dataInicio: data.data,
          dataFim: data.dataFim || null,
          diaVencimento: data.periodicidade === "MENSAL" || data.periodicidade === "ANUAL" ? diaDoMes : null,
          categoriaId: isTransferencia ? null : data.categoriaId,
          contaId: data.contaOrigemId,
        };
        await createRecorrenteMutation.mutateAsync(payload);
      } else if (cartaoCorrespondente && isDespesa) {
        // Enviar para API de Cartões (Faturas) - Apenas se NÃO for recorrente (Compras normais/parceladas)
        await compraCartaoMutation.mutateAsync({
           cartaoId: cartaoCorrespondente.id,
           categoriaId: data.categoriaId!,
           descricao: data.descricao,
           valor: data.valor,
           parcelas: data.parcelas || 1,
           data: data.data,
        });
      } else {
        // Enviar para API normal de transações
        const payload = {
          ...data,
          tipoDespesa: isDespesa ? data.tipoDespesa : null,
          categoriaId: isTransferencia ? null : data.categoriaId,
          contaDestinoId: isTransferencia ? data.contaDestinoId : null,
        };
        await createMutation.mutateAsync(payload);
      }
      reset();
      onSuccess();
    } catch (e) {
      console.error("Form error:", e);
    }
  };

  const isSaving = isSubmitting || createMutation.isPending || createRecorrenteMutation.isPending || compraCartaoMutation.isPending;

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
              <Popover open={openOrigem} onOpenChange={setOpenOrigem}>
                <PopoverTrigger>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between bg-black/40 border-border/50 font-normal hover:bg-black/50",
                      !field.value && "text-muted-foreground",
                      errors.contaOrigemId && "border-red-500/50"
                    )}
                  >
                    {field.value
                      ? contas.find((c) => c.id === field.value)?.nome
                      : "Selecione a conta"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 glass-panel border-border/40">
                  <Command className="bg-transparent" shouldFilter={false}>
                    <CommandInput 
                      placeholder="Buscar conta..." 
                      className="h-9" 
                      value={searchOrigem}
                      onValueChange={(val) => setSearchOrigem(val)}
                    />
                    <CommandList>
                      {contas.filter(c => c.nome.toLowerCase().includes(searchOrigem.toLowerCase())).length === 0 && (
                        <CommandEmpty>Nenhuma conta encontrada.</CommandEmpty>
                      )}
                      <CommandGroup>
                        {contas
                          .filter(c => c.nome.toLowerCase().includes(searchOrigem.toLowerCase()))
                          .map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                field.onChange(c.id);
                                setOpenOrigem(false);
                                setSearchOrigem("");
                              }}
                              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === c.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {c.nome}
                            </div>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                <Popover open={openDestino} onOpenChange={setOpenDestino}>
                  <PopoverTrigger>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between bg-black/40 border-border/50 font-normal hover:bg-black/50",
                        !field.value && "text-muted-foreground",
                        errors.contaDestinoId && "border-red-500/50"
                      )}
                    >
                      {field.value
                        ? contas.find((c) => c.id === field.value)?.nome
                        : "Selecione a conta destino"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 glass-panel border-border/40">
                    <Command className="bg-transparent" shouldFilter={false}>
                      <CommandInput 
                        placeholder="Buscar conta..." 
                        className="h-9" 
                        value={searchDestino}
                        onValueChange={(val) => setSearchDestino(val)}
                      />
                      <CommandList>
                        {contas.filter(c => c.nome.toLowerCase().includes(searchDestino.toLowerCase())).length === 0 && (
                          <CommandEmpty>Nenhuma conta encontrada.</CommandEmpty>
                        )}
                        <CommandGroup>
                          {contas
                            .filter(c => c.nome.toLowerCase().includes(searchDestino.toLowerCase()))
                            .map((c) => (
                              <div
                                key={c.id}
                                onClick={() => {
                                  field.onChange(c.id);
                                  setOpenDestino(false);
                                  setSearchDestino("");
                                }}
                                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === c.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {c.nome}
                              </div>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            />
          ) : (
            // Category for Receita/Despesa
            <Controller
              name="categoriaId"
              control={control}
              render={({ field }) => (
                <Popover open={openCategoria} onOpenChange={setOpenCategoria}>
                  <PopoverTrigger>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between bg-black/40 border-border/50 font-normal hover:bg-black/50",
                        !field.value && "text-muted-foreground",
                        errors.categoriaId && "border-red-500/50"
                      )}
                    >
                      {field.value
                        ? categorias.find((c) => c.id === field.value)?.nome
                        : "Selecione a categoria"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 glass-panel border-border/40">
                    <Command className="bg-transparent" shouldFilter={false}>
                      <CommandInput 
                        placeholder="Buscar categoria..." 
                        className="h-9" 
                        value={searchCategoria}
                        onValueChange={(val) => setSearchCategoria(val)}
                      />
                      <CommandList>
                        {categorias
                          .filter(c => c.tipo.toString() === tipoSelecionado.toString())
                          .filter(c => c.nome.toLowerCase().includes(searchCategoria.toLowerCase()))
                          .length === 0 && (
                          <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                        )}
                        <CommandGroup>
                          {categorias
                            .filter(c => c.tipo.toString() === tipoSelecionado.toString())
                            .filter(c => c.nome.toLowerCase().includes(searchCategoria.toLowerCase()))
                            .map((c) => (
                              <div
                                key={c.id}
                                onClick={() => {
                                  field.onChange(c.id);
                                  setOpenCategoria(false);
                                  setSearchCategoria("");
                                }}
                                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === c.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {c.nome}
                              </div>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            />
          )}

          {errors.contaDestinoId && isTransferencia && <p className="text-red-400 text-xs mt-1">{errors.contaDestinoId.message}</p>}
          {errors.categoriaId && !isTransferencia && <p className="text-red-400 text-xs mt-1">{errors.categoriaId.message}</p>}
        </div>

        {/* Tipo de Despesa (Apenas para Despesas não recorrentes, ou deixamos para recorrentes tb) */}
        {isDespesa && !isRecorrente && (
          <div className="space-y-2 md:col-span-2">
            <Label>Comportamento do Gasto</Label>
            <Controller
              name="tipoDespesa"
              control={control}
              render={({ field }) => (
                <div className="flex gap-3 mt-1">
                  <label className={`flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded border border-border/50 cursor-pointer transition-colors ${field.value === 'FIXA' ? 'bg-primary/20 border-primary/60 text-white' : 'bg-black/40 text-muted-foreground hover:bg-white/5'}`}>
                    <input type="radio" value="FIXA" checked={field.value === 'FIXA'} onChange={() => field.onChange('FIXA')} className="sr-only" />
                    <span className="font-medium text-sm">Fixa (Ex: Luz, Aluguel)</span>
                  </label>
                  <label className={`flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded border border-border/50 cursor-pointer transition-colors ${field.value === 'VARIAVEL' ? 'bg-primary/20 border-primary/60 text-white' : 'bg-black/40 text-muted-foreground hover:bg-white/5'}`}>
                    <input type="radio" value="VARIAVEL" checked={field.value === 'VARIAVEL'} onChange={() => field.onChange('VARIAVEL')} className="sr-only" />
                    <span className="font-medium text-sm">Variável (Ex: Lanche, Roupa)</span>
                  </label>
                </div>
              )}
            />
          </div>
        )}
      </div>

      {/* Recurrence Checkbox */}
      {!isTransferencia && (
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
          <div className="flex items-center space-x-2">
            <Controller
              name="isRecorrente"
              control={control}
              render={({ field }) => (
                <Checkbox 
                  id="isRecorrente" 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                  className="border-primary/50 text-primary"
                />
              )}
            />
            <Label htmlFor="isRecorrente" className="cursor-pointer text-sm font-medium flex items-center gap-2">
              <Repeat size={16} className="text-primary" />
              Tornar este lançamento recorrente (ex: Assinaturas, Aluguel, Salário)
            </Label>
          </div>

          {isRecorrente && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-primary/10">
              <div className="space-y-2 relative">
                <Label>Periodicidade</Label>
                <Controller
                  name="periodicidade"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className={`bg-black/40 border-border/50 ${errors.periodicidade ? 'border-red-500/50' : ''}`}>
                        <SelectValue placeholder="Selecione a frequência">
                          {field.value === "DIARIA" ? "Diariamente" :
                           field.value === "SEMANAL" ? "Semanalmente" :
                           field.value === "QUINZENAL" ? "Quinzenalmente" :
                           field.value === "MENSAL" ? "Mensalmente" :
                           field.value === "ANUAL" ? "Anualmente" : "Selecione a frequência"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="glass-panel border-border/40">
                        <SelectItem value="DIARIA">Diariamente</SelectItem>
                        <SelectItem value="SEMANAL">Semanalmente</SelectItem>
                        <SelectItem value="QUINZENAL">Quinzenalmente</SelectItem>
                        <SelectItem value="MENSAL">Mensalmente</SelectItem>
                        <SelectItem value="ANUAL">Anualmente</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.periodicidade && <p className="text-red-400 text-xs mt-1">{errors.periodicidade.message}</p>}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="dataFim">Data de Término (Opcional)</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="dataFim"
                    type="date"
                    className="bg-black/40 border-border/50 pl-10"
                    {...register("dataFim")}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="space-y-2 relative">
            <Label htmlFor="data">{isRecorrente ? "Data do Primeiro Lançamento" : "Data do Lançamento"}</Label>
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

         {!isRecorrente && !isCartao && (
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
         )}

         {isCartao && !isRecorrente && (
           <div className="space-y-2 relative">
              <Label>Parcelamento no Cartão</Label>
              <Controller
                name="parcelas"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value?.toString() || "1"}>
                    <SelectTrigger className="bg-black/40 border-border/50">
                      <SelectValue placeholder="1x" />
                    </SelectTrigger>
                    <SelectContent className="glass-panel border-border/40">
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
           </div>
         )}
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
          disabled={isSaving}
          className={`${isRecorrente ? 'bg-primary' : 'bg-primary'} hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(var(--primary),0.4)]`}
        >
          {isSaving ? "Salvando..." : (isRecorrente ? "Configurar Recorrência" : "Salvar Lançamento")}
        </Button>
      </div>
    </form>
  );
}
