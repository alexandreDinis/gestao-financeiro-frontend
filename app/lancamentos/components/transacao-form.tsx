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
import { useCriarDividaMutation } from "@/features/dividas/hooks/use-dividas-mutation";
import { DividaRequest } from "@/features/dividas/types";
import { usePessoasQuery } from "@/features/pessoas/hooks/use-pessoas-query";
import { format, addMonths } from "date-fns";

import { TipoTransacao, TipoConta, Conta, Categoria, ApiResponse } from "@/types";
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
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, CalendarIcon, Repeat, Check, ChevronsUpDown, CreditCard, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// 1. Zod Validation Schema
const transacaoSchema = z.object({
  descricao: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
  valor: z.number().positive("O valor deve ser maior que zero"),
  data: z.string().nonempty("Data é obrigatória"),
  dataVencimento: z.string().optional().nullable(),
  tipo: z.nativeEnum(TipoTransacao),
  tipoDespesa: z.enum(["FIXA", "VARIAVEL"]).optional().nullable(),
  categoriaId: z.number().optional().nullable(),
  contaOrigemId: z.number().optional().nullable(),
  contaDestinoId: z.number().optional().nullable(),
  observacao: z.string().optional().nullable(),
  
  // Recurrence fields
  isRecorrente: z.boolean().optional(),
  periodicidade: z.enum(["DIARIA", "SEMANAL", "QUINZENAL", "MENSAL", "ANUAL"]).optional().nullable(),
  dataFim: z.string().optional().nullable(),
  
  // Credit Card fields
  parcelas: z.number().min(1).optional().nullable(),

  // Installment (non-card) fields
  isParcelado: z.boolean().optional(),
  numParcelas: z.coerce.number().min(2, "Mínimo 2 parcelas").max(360, "Máximo 360 parcelas").optional().nullable(),
  pessoaId: z.number().optional().nullable(),

  // Status
  isPago: z.boolean(),
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

export function TransacaoForm({ onSuccess, initialData }: { onSuccess: () => void, initialData?: any }) {
  const createMutation = useCreateTransacao();
  const updateRecorrenteMutation = { 
    mutateAsync: async (data: any) => { 
      return api.put(`/recorrencias/${initialData.id}`, data);
    },
    isPending: false
  };
  const createRecorrenteMutation = useCreateTransacaoRecorrente();
  const compraCartaoMutation = useCompraCartaoMutation();
  const criarDividaMutation = useCriarDividaMutation();
  const { data: fetchPessoas } = usePessoasQuery();
  const pessoas = fetchPessoas || [];

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
    defaultValues: initialData ? {
      descricao: initialData.descricao,
      valor: initialData.valor,
      tipo: initialData.tipo as TipoTransacao,
      data: initialData.dataInicio || new Date().toISOString().split("T")[0],
      dataVencimento: initialData.dataVencimento || null,
      isRecorrente: true,
      periodicidade: initialData.periodicidade,
      categoriaId: initialData.categoria?.id || null,
      contaOrigemId: initialData.conta?.id,
      contaDestinoId: initialData.contaDestino?.id || null,
      observacao: initialData.observacao || null,
      dataFim: initialData.dataFim || null,
      parcelas: initialData.parcelas || null,
      isParcelado: initialData.isParcelado || false,
      numParcelas: initialData.numParcelas || null,
      pessoaId: initialData.pessoa?.id || null,
      isPago: initialData.status === "PAGO",
    } : {
      tipo: TipoTransacao.DESPESA,
      data: new Date().toISOString().split("T")[0],
      descricao: "",
      valor: 0,
      dataVencimento: null,
      tipoDespesa: null,
      categoriaId: null,
      contaOrigemId: null,
      contaDestinoId: null,
      observacao: null,
      isRecorrente: false,
      periodicidade: null,
      dataFim: null,
      parcelas: null,
      isParcelado: false,
      numParcelas: null,
      pessoaId: null,
      isPago: true,
    },
  });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [openOrigem, setOpenOrigem] = useState(false);
  const [openDestino, setOpenDestino] = useState(false);
  const [openCategoria, setOpenCategoria] = useState(false);

  const [searchOrigem, setSearchOrigem] = useState("");
  const [searchDestino, setSearchDestino] = useState("");
  const [searchCategoria, setSearchCategoria] = useState("");

  const [showPreview, setShowPreview] = useState(false);
  const [manualParcelas, setManualParcelas] = useState<{ id: number, valor: number, vencimento: string }[]>([]);
  const [somaParcelas, setSomaParcelas] = useState(0);

  const tipoSelecionado = watch("tipo");
  const contaOrigemSelecionada = watch("contaOrigemId");
  const watchValor = watch("valor");
  const watchData = watch("data");
  const isRecorrente = watch("isRecorrente");
  const isParcelado = watch("isParcelado");
  const numParcelasCount = watch("numParcelas");
  
  const isTransferencia = tipoSelecionado === TipoTransacao.TRANSFERENCIA;
  const isDespesa = tipoSelecionado === TipoTransacao.DESPESA;
  const isCartao = cartoes.some(c => c.contaId === contaOrigemSelecionada);

  // Calculate installments preview
  useEffect(() => {
    if (isParcelado && !isRecorrente && !isCartao && watchValor > 0 && numParcelasCount && numParcelasCount >= 2 && watchData) {
      const baseValue = parseFloat((watchValor / numParcelasCount).toFixed(2));
      const newParcelas = [];
      let currentSum = 0;
      const startDate = new Date(watchData + "T12:00:00");

      for (let i = 0; i < numParcelasCount; i++) {
        const val = i === numParcelasCount - 1 
          ? parseFloat((watchValor - currentSum).toFixed(2))
          : baseValue;
        currentSum += val;
        const nextDate = addMonths(startDate, i);
        newParcelas.push({ id: i + 1, valor: val, vencimento: format(nextDate, "yyyy-MM-dd") });
      }
      
      setManualParcelas(newParcelas);
      setSomaParcelas(parseFloat(currentSum.toFixed(2)));
      setShowPreview(true);
    } else {
      setShowPreview(false);
    }
  }, [watchValor, watchData, isParcelado, numParcelasCount, isRecorrente, isCartao]);

  // 4. Submit Handler
  const onSubmit = async (data: TransacaoFormValues) => {
    try {
      const cartaoCorrespondente = cartoes.find(c => c.contaId === data.contaOrigemId);

      if (data.isRecorrente) {
        const diaDoMes = new Date(data.data + "T12:00:00Z").getDate();
        const payload = {
          descricao: data.descricao,
          valor: data.valor,
          tipo: data.tipo,
          periodicidade: data.periodicidade || undefined,
          dataInicio: data.data,
          dataFim: data.dataFim || undefined,
          diaVencimento: data.periodicidade === "MENSAL" || data.periodicidade === "ANUAL" ? diaDoMes : undefined,
          categoriaId: isTransferencia ? undefined : (data.categoriaId || undefined),
          contaId: data.contaOrigemId,
        };

        if (initialData?.id) {
          await updateRecorrenteMutation.mutateAsync(payload);
        } else {
          await createRecorrenteMutation.mutateAsync(payload);
        }
      } else if (cartaoCorrespondente && isDespesa) {
        await compraCartaoMutation.mutateAsync({
           cartaoId: cartaoCorrespondente.id,
           categoriaId: data.categoriaId!,
           descricao: data.descricao,
           valor: data.valor,
           parcelas: data.parcelas || undefined,
           data: data.data,
        });
      } else if (data.isParcelado && data.numParcelas && data.numParcelas >= 2) {
        const dividaPayload: DividaRequest = {
          pessoaId: data.pessoaId || undefined,
          descricao: data.descricao,
          tipo: data.tipo === TipoTransacao.RECEITA ? 'A_RECEBER' : 'A_PAGAR',
          valorTotal: data.valor,
          dataInicio: data.data,
          parcelas: data.numParcelas,
          observacao: data.observacao || undefined,
        };
        await criarDividaMutation.mutateAsync(dividaPayload);
      } else {
        const payload = {
          ...data,
          tipoDespesa: isDespesa ? (data.tipoDespesa || undefined) : undefined,
          categoriaId: isTransferencia ? undefined : (data.categoriaId || undefined),
          contaDestinoId: isTransferencia ? (data.contaDestinoId || undefined) : undefined,
          observacao: data.observacao || undefined,
          dataVencimento: data.dataVencimento || undefined,
          status: data.isPago ? "PAGO" : "PENDENTE",
        };
        await createMutation.mutateAsync(payload as any);
      }
      reset();
      onSuccess();
    } catch (e) {
      console.error("Form error:", e);
    }
  };

  const isSaving = isSubmitting || createMutation.isPending || createRecorrenteMutation.isPending || compraCartaoMutation.isPending || criarDividaMutation.isPending;

  if (!isMounted) return null;

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
            className={cn(
              "bg-transparent border-border/50",
              errors.descricao && "border-red-500/50"
            )}
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
                 className={cn(
                   "bg-transparent text-lg font-medium border-border/50",
                   tipoSelecionado === TipoTransacao.DESPESA ? 'text-red-400' :
                   tipoSelecionado === TipoTransacao.RECEITA ? 'text-green-400' : 'text-blue-400',
                   errors.valor && "border-red-500/50"
                 )}
                 placeholder="R$ 0,00"
               />
            )}
          />
          {errors.valor && <p className="text-red-400 text-xs mt-1">{errors.valor.message}</p>}
        </div>
      </div>

      {/* Dynamic Accounts & Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Origin Account */}
        <div className="space-y-2">
          <Label>{isTransferencia ? "Conta de Origem" : "Conta"}</Label>
          <Controller
            name="contaOrigemId"
            control={control}
            render={({ field }) => (
              <Popover open={openOrigem} onOpenChange={setOpenOrigem}>
                <PopoverTrigger render={
                  <button
                    type="button"
                    className={cn(
                      "group/button inline-flex h-10 w-full shrink-0 items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm font-medium transition-all outline-none select-none hover:bg-input/50 focus-visible:ring-3 focus-visible:ring-ring/50",
                      !field.value && "text-muted-foreground",
                      errors.contaOrigemId && "border-red-500/50"
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {field.value
                        ? (contas.find((c) => c.id === field.value)?.nome || "Selecione a conta")
                        : field.value === 0 ? "Nenhuma conta" : "Selecione a conta"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </button>
                } />
                <PopoverContent className="w-72 p-0 glass-panel border-border/40 overflow-hidden">
                  <div className="flex flex-col h-full bg-popover">
                    <div className="flex items-center border-b px-3 h-10 shrink-0">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <input
                        placeholder="Buscar conta..."
                        className="flex h-full w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        value={searchOrigem}
                        onChange={(e) => setSearchOrigem(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1 scrollbar-thin">
                      <button
                        type="button"
                        onClick={() => {
                          field.onChange(0);
                          setOpenOrigem(false);
                          setSearchOrigem("");
                        }}
                        className="w-full flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-amber-400 hover:bg-amber-400/10 transition-colors text-left font-medium"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            field.value === 0 ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">Nenhuma conta</span>
                      </button>

                      {contas.filter(c => c.nome.toLowerCase().includes(searchOrigem.toLowerCase())).length === 0 && searchOrigem && (
                        <div className="py-6 text-center text-sm text-muted-foreground">Nenhuma conta encontrada.</div>
                      )}
                      
                      {contas
                        .filter(c => c.tipo !== TipoConta.CARTAO_CREDITO)
                        .filter(c => c.nome.toLowerCase().includes(searchOrigem.toLowerCase()))
                        .length > 0 && (
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Contas Bancárias</div>
                      )}
                      
                      {contas
                        .filter(c => c.tipo !== TipoConta.CARTAO_CREDITO)
                        .filter(c => c.nome.toLowerCase().includes(searchOrigem.toLowerCase()))
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              field.onChange(c.id);
                              setOpenOrigem(false);
                              setSearchOrigem("");
                            }}
                            className="w-full flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors text-left"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 shrink-0",
                                field.value === c.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="truncate">{c.nome}</span>
                          </button>
                        ))}

                      {contas
                        .filter(c => c.tipo === TipoConta.CARTAO_CREDITO)
                        .filter(c => c.nome.toLowerCase().includes(searchOrigem.toLowerCase()))
                        .length > 0 && (
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mt-2">Cartões de Crédito</div>
                      )}
                      
                      {contas
                        .filter(c => c.tipo === TipoConta.CARTAO_CREDITO)
                        .filter(c => c.nome.toLowerCase().includes(searchOrigem.toLowerCase()))
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              field.onChange(c.id);
                              setOpenOrigem(false);
                              setSearchOrigem("");
                            }}
                            className="w-full flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors text-left"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 shrink-0",
                                field.value === c.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="truncate">{c.nome}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.contaOrigemId && <p className="text-red-400 text-xs mt-1">{errors.contaOrigemId.message}</p>}
        </div>

        {/* Dynamic Second Field */}
        <div className="space-y-2">
          <Label>{isTransferencia ? "Conta de Destino" : "Categoria"}</Label>
          
          {isTransferencia ? (
            <Controller
              name="contaDestinoId"
              control={control}
              render={({ field }) => (
                <Popover open={openDestino} onOpenChange={setOpenDestino}>
                  <PopoverTrigger render={
                    <button
                      type="button"
                      className={cn(
                        "group/button inline-flex h-10 w-full shrink-0 items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm font-medium transition-all outline-none select-none hover:bg-input/50 focus-visible:ring-3 focus-visible:ring-ring/50",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {field.value
                          ? contas.find((c) => c.id === field.value)?.nome
                          : "Selecione a conta destino"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </button>
                  } />
                  <PopoverContent className="w-72 p-0 glass-panel border-border/40 overflow-hidden">
                    <div className="flex flex-col h-full bg-popover">
                      <div className="flex items-center border-b px-3 h-10 shrink-0">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          placeholder="Buscar conta..."
                          className="flex h-full w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          value={searchDestino}
                          onChange={(e) => setSearchDestino(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto p-1 scrollbar-thin">
                        {contas.filter(c => c.nome.toLowerCase().includes(searchDestino.toLowerCase())).length === 0 && (
                          <div className="py-6 text-center text-sm text-muted-foreground">Nenhuma conta encontrada.</div>
                        )}
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Contas Bancárias</div>
                        {contas
                          .filter(c => c.tipo !== TipoConta.CARTAO_CREDITO)
                          .filter(c => c.nome.toLowerCase().includes(searchDestino.toLowerCase()))
                          .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                field.onChange(c.id);
                                setOpenDestino(false);
                                setSearchDestino("");
                              }}
                              className="w-full flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors text-left"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  field.value === c.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{c.nome}</span>
                            </button>
                          ))}
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mt-2">Cartões de Crédito</div>
                        {contas
                          .filter(c => c.tipo === TipoConta.CARTAO_CREDITO)
                          .filter(c => c.nome.toLowerCase().includes(searchDestino.toLowerCase()))
                          .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                field.onChange(c.id);
                                setOpenDestino(false);
                                setSearchDestino("");
                              }}
                              className="w-full flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors text-left"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  field.value === c.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{c.nome}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            />
          ) : (
            <Controller
              name="categoriaId"
              control={control}
              render={({ field }) => (
                <Popover open={openCategoria} onOpenChange={setOpenCategoria}>
                  <PopoverTrigger render={
                    <button
                      type="button"
                      className={cn(
                        "group/button inline-flex h-10 w-full shrink-0 items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm font-medium transition-all outline-none select-none hover:bg-input/50 focus-visible:ring-3 focus-visible:ring-ring/50",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {field.value
                          ? categorias.find((c) => c.id === field.value)?.nome
                          : "Selecione a categoria"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </button>
                  } />
                  <PopoverContent className="w-72 p-0 glass-panel border-border/40 overflow-hidden">
                    <div className="flex flex-col h-full bg-popover">
                      <div className="flex items-center border-b px-3 h-10 shrink-0">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          placeholder="Buscar categoria..."
                          className="flex h-full w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          value={searchCategoria}
                          onChange={(e) => setSearchCategoria(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto p-1 scrollbar-thin">
                        {categorias
                          .filter(c => c.tipo.toString() === tipoSelecionado.toString())
                          .filter(c => c.nome.toLowerCase().includes(searchCategoria.toLowerCase()))
                          .length === 0 && (
                          <div className="py-6 text-center text-sm text-muted-foreground">Nenhuma categoria encontrada.</div>
                        )}
                        {categorias
                          .filter(c => c.tipo.toString() === tipoSelecionado.toString())
                          .filter(c => c.nome.toLowerCase().includes(searchCategoria.toLowerCase()))
                          .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                field.onChange(c.id);
                                setOpenCategoria(false);
                                setSearchCategoria("");
                              }}
                              className="w-full flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors text-left"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  field.value === c.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate">{c.nome}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            />
          )}

          {errors.contaDestinoId && isTransferencia && <p className="text-red-400 text-xs mt-1">{errors.contaDestinoId.message}</p>}
          {errors.categoriaId && !isTransferencia && <p className="text-red-400 text-xs mt-1">{errors.categoriaId.message}</p>}
        </div>

        {/* Behavior Selector */}
        {isDespesa && !isRecorrente && (
          <div className="space-y-2 md:col-span-2">
            <Label>Comportamento do Gasto</Label>
            <Controller
              name="tipoDespesa"
              control={control}
              render={({ field }) => (
                <div className="flex gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => field.onChange('FIXA')}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded border transition-colors",
                      field.value === 'FIXA' ? "bg-primary/20 border-primary text-primary-foreground" : "bg-background border-input hover:bg-accent"
                    )}
                  >
                    <span className="font-medium text-sm">Fixa (Ex: Luz, Aluguel)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange('VARIAVEL')}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded border transition-colors",
                      field.value === 'VARIAVEL' ? "bg-primary/20 border-primary text-primary-foreground" : "bg-background border-input hover:bg-accent"
                    )}
                  >
                    <span className="font-medium text-sm">Variável (Ex: Lanche, Roupa)</span>
                  </button>
                </div>
              )}
            />
          </div>
        )}
      </div>

      {/* Date & Pay Status row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data">Data do Lançamento</Label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="data"
              type="date"
              className="pl-10 bg-transparent"
              {...register("data")}
            />
          </div>
        </div>

        {!isRecorrente && !isCartao && !isTransferencia && (
          <div className="flex items-center space-x-2 py-2 px-4 rounded-lg border border-green-500/20 bg-green-500/5">
            <Controller
              name="isPago"
              control={control}
              render={({ field }) => (
                <Checkbox 
                  id="isPago" 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                />
              )}
            />
            <Label htmlFor="isPago" className="cursor-pointer text-sm font-medium flex items-center gap-2">
              <Check size={16} className="text-green-500" />
              Já foi {tipoSelecionado === TipoTransacao.RECEITA ? 'recebido' : 'pago'}
            </Label>
          </div>
        )}
      </div>

      {/* Recurrence Checkbox */}
      {!isTransferencia && (
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-4">
          <div className="flex items-center space-x-2">
            <Controller
              name="isRecorrente"
              control={control}
              render={({ field }) => (
                <Checkbox 
                  id="isRecorrente" 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                />
              )}
            />
            <Label htmlFor="isRecorrente" className="cursor-pointer text-sm font-medium flex items-center gap-2">
              <Repeat size={16} className="text-primary" />
              Tornar este lançamento recorrente
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
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência">
                          {field.value === "DIARIA" ? "Diariamente" :
                           field.value === "SEMANAL" ? "Semanalmente" :
                           field.value === "QUINZENAL" ? "Quinzenalmente" :
                           field.value === "MENSAL" ? "Mensalmente" :
                           field.value === "ANUAL" ? "Anualmente" : "Selecione a frequência"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
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
                    className="pl-10 bg-transparent"
                    {...register("dataFim")}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Credit Card Details row */}
      {isCartao && isDespesa && !isRecorrente && (
        <div className="p-4 rounded-lg border border-orange-500/20 bg-orange-500/5 space-y-4">
          <div className="flex items-center gap-2 text-orange-500">
            <CreditCard size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">Configurações de Fatura</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="parcelas">Número de Parcelas</Label>
                <NumericFormat
                  id="parcelas"
                  value={watch("parcelas") || ""}
                  allowNegative={false}
                  decimalScale={0}
                  onValueChange={(values) => {
                    const val = values.floatValue || 1;
                    reset({ ...watch(), parcelas: val });
                  }}
                  customInput={Input}
                  className="bg-transparent"
                  placeholder="1"
                />
                <p className="text-[10px] text-muted-foreground">O valor total será dividido em parcelas mensais.</p>
             </div>
             <div className="flex items-end pb-3">
                <div className="text-xs text-orange-400 font-medium">
                  {watch("parcelas") && (watch("parcelas") || 0) > 1 ? (
                    <span>Previsão: {watch("parcelas")}x de R$ {(watchValor / (watch("parcelas") || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  ) : (
                    <span>À vista na próxima fatura</span>
                  )}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Manual Installments row */}
      {!isCartao && !isRecorrente && isDespesa && (
        <div className="p-4 rounded-lg border border-purple-500/20 bg-purple-500/5 space-y-4">
          <div className="flex items-center space-x-2">
             <Controller
               name="isParcelado"
               control={control}
               render={({ field }) => (
                 <Checkbox 
                   id="isParcelado" 
                   checked={field.value} 
                   onCheckedChange={field.onChange} 
                 />
               )}
             />
             <Label htmlFor="isParcelado" className="cursor-pointer text-sm font-medium flex items-center gap-2">
               <CalendarIcon size={16} className="text-purple-400" />
               Parcelar este lançamento (Carnê/Promissória)
             </Label>
          </div>

          {isParcelado && (
            <div className="space-y-4 pt-4 border-t border-purple-500/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantidade de Parcelas</Label>
                  <Input 
                    type="number" 
                    min={2} 
                    max={360}
                    {...register("numParcelas")}
                    placeholder="2"
                    className="bg-transparent"
                  />
                  {errors.numParcelas && <p className="text-red-400 text-xs mt-1">{errors.numParcelas.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Pessoa/Credor</Label>
                  <Controller
                    name="pessoaId"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        onValueChange={(val) => field.onChange(parseInt(val))} 
                        value={field.value?.toString() || ""}
                      >
                        <SelectTrigger className="bg-transparent">
                          <SelectValue placeholder="Selecione o credor" />
                        </SelectTrigger>
                        <SelectContent>
                          {pessoas.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {showPreview && manualParcelas.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label className="text-xs text-purple-400 uppercase tracking-widest font-bold">Resumo das Parcelas</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {manualParcelas.map((p) => (
                      <div key={p.id} className="p-2 rounded border border-purple-500/10 bg-black/20 text-[10px]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-muted-foreground">{p.id}ª</span>
                          <span className="text-purple-300">R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <CalendarIcon size={8} />
                          {format(new Date(p.vencimento + "T12:00:00"), "dd/MM/yy")}
                        </div>
                      </div>
                    ))}
                  </div>
                  {somaParcelas !== watchValor && (
                    <p className="text-[10px] text-orange-400 italic">
                      * Ajuste de centavos aplicado na última parcela. Total: R$ {somaParcelas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Observation */}
      <div className="space-y-2">
        <Label htmlFor="observacao">Observações (Opcional)</Label>
        <Input
          id="observacao"
          placeholder="Ex: Notas adicionais sobre o lançamento..."
          className="bg-transparent border-border/50"
          {...register("observacao")}
        />
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
         <Button type="button" variant="ghost" onClick={onSuccess} disabled={isSaving}>
            Cancelar
         </Button>
         <Button 
           type="submit" 
           className={cn(
             "px-8 transition-all hover:scale-[1.02] active:scale-[0.98]",
             tipoSelecionado === TipoTransacao.RECEITA ? "bg-green-600 hover:bg-green-500" :
             tipoSelecionado === TipoTransacao.TRANSFERENCIA ? "bg-blue-600 hover:bg-blue-500" : "bg-primary"
           )}
           disabled={isSaving}
         >
            {isSaving ? "Salvando..." : (initialData?.id ? "Atualizar" : "Salvar Lançamento")}
         </Button>
      </div>

    </form>
  );
}
