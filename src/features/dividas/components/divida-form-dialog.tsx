"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format, addMonths } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCriarDividaMutation } from "../hooks/use-dividas-mutation";
import { usePessoasQuery } from "@/features/pessoas/hooks/use-pessoas-query";
import { PessoaFormDialog } from "@/features/pessoas/components/pessoa-form-dialog";
import { RefreshCw } from "lucide-react";
import { toast } from "@/lib/toast";

interface FormValues {
  pessoaId?: number;
  descricao: string;
  tipo: "A_RECEBER" | "A_PAGAR";
  valorTotal: number;
  dataInicio: string;
  parcelasCount: number;
  observacao?: string;
  recorrente: boolean;
  diaVencimento?: number;
  dataFim?: string;
}



interface DividaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoDefault?: "A_RECEBER" | "A_PAGAR";
}

export function DividaFormDialog({ open, onOpenChange, tipoDefault = "A_RECEBER" }: DividaFormDialogProps) {
  const criarMutation = useCriarDividaMutation();
  const { data: pessoas } = usePessoasQuery();
  
  const [inlinePessoaOpen, setInlinePessoaOpen] = useState(false);
  
  const [showPreview, setShowPreview] = useState(false);
  const [manualParcelas, setManualParcelas] = useState<{ id: number, valor: number, vencimento: string }[]>([]);
  const [somaParcelas, setSomaParcelas] = useState(0);

  const form = useForm<FormValues>({
    defaultValues: {
      pessoaId: undefined,
      descricao: "",
      tipo: tipoDefault,
      valorTotal: 0,
      dataInicio: format(new Date(), "yyyy-MM-dd"),
      parcelasCount: 1,
      observacao: "",
      recorrente: false,
      diaVencimento: undefined,
      dataFim: undefined,
    },
  });

  const watchValorTotal = form.watch("valorTotal");
  const watchParcelasCount = form.watch("parcelasCount");
  const watchDataInicio = form.watch("dataInicio");
  const watchRecorrente = form.watch("recorrente");
  const isPending = criarMutation.isPending;

  useEffect(() => {
    if (watchRecorrente) {
      setShowPreview(false);
      return;
    }
    if (watchValorTotal > 0 && watchParcelasCount > 0 && watchDataInicio) {
      const baseValue = parseFloat((watchValorTotal / watchParcelasCount).toFixed(2));
      const newParcelas = [];
      let currentSum = 0;
      const startDate = new Date(watchDataInicio + "T12:00:00");

      for (let i = 0; i < watchParcelasCount; i++) {
        const val = i === watchParcelasCount - 1 
          ? parseFloat((watchValorTotal - currentSum).toFixed(2))
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
  }, [watchValorTotal, watchParcelasCount, watchDataInicio, watchRecorrente]);

  useEffect(() => {
    const sum = manualParcelas.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    setSomaParcelas(parseFloat(sum.toFixed(2)));
  }, [manualParcelas]);

  const handleManualEdit = (index: number, field: 'valor' | 'vencimento', value: string) => {
    const newParcelas = [...manualParcelas];
    if (field === 'valor') {
      newParcelas[index].valor = parseFloat(value) || 0;
    } else {
      newParcelas[index].vencimento = value;
    }
    setManualParcelas(newParcelas);
  };

  const onSubmit = (values: FormValues) => {
    // Validação manual explícita
    const errors: string[] = [];
    if (!values.descricao || values.descricao.length < 3) errors.push("Descrição deve ter no mínimo 3 caracteres");
    if (!values.valorTotal || values.valorTotal <= 0) errors.push("Valor deve ser maior que zero");
    if (!values.dataInicio) errors.push("Data de Início é obrigatória");
    if (!values.recorrente && (!values.parcelasCount || values.parcelasCount < 1)) errors.push("No mínimo 1 parcela");

    if (errors.length > 0) {
      toast.error("Campos inválidos", errors.join(", "));
      return;
    }

    if (values.recorrente) {
      const request = {
        pessoaId: values.pessoaId,
        descricao: values.descricao,
        tipo: values.tipo,
        valorTotal: values.valorTotal,
        dataInicio: values.dataInicio,
        dataFim: values.dataFim || undefined,
        observacao: values.observacao,
        recorrente: true,
        periodicidade: "MENSAL" as const,
        diaVencimento: values.diaVencimento || undefined,
        valorParcelaRecorrente: values.valorTotal,
      };

      criarMutation.mutate(request, {
        onSuccess: () => { form.reset(); onOpenChange(false); }
      });
    } else {
      if (Math.abs(somaParcelas - values.valorTotal) > 0.05) {
        toast.error("Divergência", `A soma das parcelas (R$ ${somaParcelas}) difere do total (R$ ${values.valorTotal})`);
        return;
      }

      const request = {
        pessoaId: values.pessoaId,
        descricao: values.descricao,
        tipo: values.tipo,
        valorTotal: values.valorTotal,
        dataInicio: values.dataInicio,
        observacao: values.observacao,
        parcelas: values.parcelasCount,
      };

      criarMutation.mutate(request, {
        onSuccess: () => { form.reset(); onOpenChange(false); }
      });
    }
  };

  const onPessoaCriada = (novaPessoaId?: number) => {
    if (novaPessoaId) form.setValue("pessoaId", novaPessoaId);
  };

  const isSubmitDisabled = isPending || (!watchRecorrente && Math.abs(somaParcelas - watchValorTotal) > 0.05);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] glass-panel border-border/40 max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${form.watch("tipo") === "A_RECEBER" ? "bg-green-500" : "bg-red-500"}`} />
              Registrar Empréstimo / Dívida
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={(e) => {
              e.preventDefault();
              onSubmit(form.getValues());
            }} className="space-y-4 py-2">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo da Operação</FormLabel>
                      <Select defaultValue={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full h-10 px-3 py-2 bg-black/40 border-border/50 text-white focus:ring-1 focus:ring-primary">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-950 border border-border/40 text-white">
                          <SelectItem value="A_RECEBER" className="focus:bg-primary/20 focus:text-primary cursor-pointer">💰 A Receber (Emprestei)</SelectItem>
                          <SelectItem value="A_PAGAR" className="focus:bg-primary/20 focus:text-primary cursor-pointer">💸 A Pagar (Tomei Emprestado)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pessoaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pessoa Relacionada</FormLabel>
                      <Select 
                        key={`select-pessoa-${pessoas?.length || 0}-${field.value}`}
                        value={field.value && field.value !== 0 ? field.value.toString() : ""} 
                        onValueChange={(val) => {
                          if (val === "new") {
                            setInlinePessoaOpen(true);
                          } else {
                            field.onChange(Number(val));
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full h-10 px-3 py-2 bg-black/40 border-border/50 text-white focus:ring-1 focus:ring-primary">
                            <SelectValue placeholder="Selecione um contato">
                              {field.value && field.value !== 0 
                                ? pessoas?.find(p => p.id === field.value)?.nome 
                                : undefined}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-950 border border-border/40 text-white max-h-[250px]">
                          <SelectItem value="new" className="text-primary font-bold focus:bg-primary/20 focus:text-primary cursor-pointer">
                            + Cadastrar Nova Pessoa
                          </SelectItem>
                          {pessoas?.map(p => (
                            <SelectItem 
                              key={p.id} 
                              value={p.id.toString()}
                              className="focus:bg-primary/20 focus:text-white cursor-pointer hover:text-white"
                            >
                              {p.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Empréstimo para compra do carro" className="bg-black/40 border-border/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ─── Toggle Recorrente ─── */}
              <FormField
                control={form.control}
                name="recorrente"
                render={({ field }) => (
                  <FormItem>
                    <div 
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        field.value 
                          ? 'border-primary/60 bg-primary/10' 
                          : 'border-border/30 bg-black/20 hover:bg-black/30'
                      }`}
                      onClick={() => field.onChange(!field.value)}
                    >
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${field.value ? 'bg-primary' : 'bg-zinc-700'}`}>
                        <div 
                          className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all"
                          style={{ left: field.value ? '22px' : '2px' }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white flex items-center gap-2">
                          <RefreshCw className={`h-3.5 w-3.5 ${field.value ? 'text-primary' : 'text-muted-foreground'}`} />
                          Dívida Recorrente
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {field.value 
                            ? "Gera uma cobrança todo mês automaticamente" 
                            : "Ativar para cobranças mensais automáticas"}
                        </div>
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="valorTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{watchRecorrente ? "Valor Mensal (R$)" : "Valor Total (R$)"}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          className="bg-black/40 border-border/50 text-white font-bold" 
                          value={field.value || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? 0 : Number(val));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchRecorrente ? (
                  <>
                    <FormField
                      control={form.control}
                      name="diaVencimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia do Vencimento</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="31" 
                              placeholder="Ex: 10"
                              className="bg-black/40 border-border/50" 
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dataFim"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Fim (Opcional)</FormLabel>
                          <FormControl>
                            <Input type="date" className="bg-black/40 border-border/50" autoComplete="off" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="parcelasCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nº Parcelas</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              className="bg-black/40 border-border/50" 
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dataInicio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data 1ª Parcela</FormLabel>
                          <FormControl>
                            <Input type="date" className="bg-black/40 border-border/50" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              {watchRecorrente && (
                <FormField
                  control={form.control}
                  name="dataInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input type="date" className="bg-black/40 border-border/50" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Preview das Parcelas (modo parcelado) */}
              {!watchRecorrente && showPreview && manualParcelas.length > 0 && (
                <div className="mt-6 border border-border/30 rounded-lg overflow-hidden bg-black/20">
                  <div className="bg-primary/10 px-4 py-2 border-b border-border/30 flex justify-between items-center">
                    <span className="text-sm font-semibold text-primary">Preview das Parcelas</span>
                    {somaParcelas !== watchValorTotal && (
                       <span className="text-xs text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded">
                         Divergência: R$ {Math.abs(somaParcelas - watchValorTotal).toFixed(2)}
                       </span>
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto p-2 space-y-2">
                    {manualParcelas.map((p, idx) => (
                      <div key={p.id} className="flex gap-4 items-center pl-2">
                        <span className="w-6 text-sm text-muted-foreground">{p.id}º</span>
                        <Input 
                          type="date" 
                          value={p.vencimento}
                          onChange={(e) => handleManualEdit(idx, 'vencimento', e.target.value)}
                          className="h-8 bg-black/40 text-xs w-36"
                        />
                        <div className="relative flex-1">
                          <span className="absolute left-2 top-2 text-xs text-muted-foreground">R$</span>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={p.valor}
                            onChange={(e) => handleManualEdit(idx, 'valor', e.target.value)}
                            className={`h-8 pl-7 text-xs font-mono font-medium bg-black/40 text-right ${p.valor < 0 ? 'text-red-400' : ''}`}
                            disabled
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-black/40 px-4 py-2 text-right border-t border-border/30 text-xs text-muted-foreground">
                    Total: <strong className="text-white">R$ {somaParcelas.toFixed(2)}</strong>
                  </div>
                </div>
              )}

              {/* Resumo Recorrência */}
              {watchRecorrente && watchValorTotal > 0 && (
                <div className="border border-primary/30 rounded-lg bg-primary/5 p-4">
                  <div className="text-xs text-primary font-semibold mb-1 flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3" />
                    Resumo da Recorrência
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Será gerada uma cobrança de <strong className="text-white">R$ {watchValorTotal.toFixed(2)}</strong> todo mês
                    {form.watch("diaVencimento") ? ` no dia ${form.watch("diaVencimento")}` : ""}.
                    {form.watch("dataFim") ? ` Até ${format(new Date(form.watch("dataFim") + "T12:00:00"), "dd/MM/yyyy")}.` : " Sem data fim definida."}
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="observacao"
                render={({ field }) => (
                  <FormItem className="pt-2">
                    <FormLabel>Nota Interna / Contexto (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ex: Empréstimo sem juros acordado verbalmente, ou chaves PIX de preferência..." 
                        className="bg-black/40 border-border/50 resize-none" 
                        rows={2}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitDisabled}
                  className="bg-primary text-black hover:bg-primary/90 min-w-[120px]"
                >
                  {isPending ? "Processando..." : watchRecorrente ? "Confirmar Recorrência" : "Confirmar Dívida"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <PessoaFormDialog 
        open={inlinePessoaOpen} 
        onOpenChange={setInlinePessoaOpen} 
        onSuccessCallback={onPessoaCriada} 
      />
    </>
  );
}
