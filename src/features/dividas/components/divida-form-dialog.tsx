"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addMonths } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

interface FormValues {
  pessoaId: number;
  descricao: string;
  tipo: "A_RECEBER" | "A_PAGAR";
  valorTotal: number;
  dataInicio: string;
  parcelasCount: number;
  observacao?: string;
}

const formSchema = z.object({
  pessoaId: z.number().min(1, "Selecione uma pessoa"),
  descricao: z.string().min(3, "Descrição muito curta"),
  tipo: z.enum(["A_RECEBER", "A_PAGAR"]),
  valorTotal: z.number().positive("Valor deve ser maior que zero"),
  dataInicio: z.string().min(1, "Data de Início é obrigatória"),
  parcelasCount: z.number().min(1, "No mínimo 1 parcela"),
  observacao: z.string().optional(),
}) satisfies z.ZodType<FormValues>;

interface DividaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoDefault?: "A_RECEBER" | "A_PAGAR";
}

export function DividaFormDialog({ open, onOpenChange, tipoDefault = "A_RECEBER" }: DividaFormDialogProps) {
  const criarMutation = useCriarDividaMutation();
  const { data: pessoas, isLoading: pessoasLoading } = usePessoasQuery();
  
  const [inlinePessoaOpen, setInlinePessoaOpen] = useState(false);
  
  // Custom states for manual installment preview
  const [showPreview, setShowPreview] = useState(false);
  const [manualParcelas, setManualParcelas] = useState<{ id: number, valor: number, vencimento: string }[]>([]);
  const [somaParcelas, setSomaParcelas] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pessoaId: 0,
      descricao: "",
      tipo: tipoDefault,
      valorTotal: 0,
      dataInicio: format(new Date(), "yyyy-MM-dd"),
      parcelasCount: 1,
      observacao: "",
    },
  });

  const watchValorTotal = form.watch("valorTotal");
  const watchParcelasCount = form.watch("parcelasCount");
  const watchDataInicio = form.watch("dataInicio");
  const isPending = criarMutation.isPending;

  // Auto-generate preview when total, count or start date changes
  useEffect(() => {
    if (watchValorTotal > 0 && watchParcelasCount > 0 && watchDataInicio) {
      const baseValue = parseFloat((watchValorTotal / watchParcelasCount).toFixed(2));
      const newParcelas = [];
      let currentSum = 0;
      const startDate = new Date(watchDataInicio + "T12:00:00"); // Avoid timezone shift

      for (let i = 0; i < watchParcelasCount; i++) {
        // Handle rounding difference on the last installment
        const val = i === watchParcelasCount - 1 
          ? parseFloat((watchValorTotal - currentSum).toFixed(2))
          : baseValue;
        
        currentSum += val;
        
        const nextDate = addMonths(startDate, i);
        
        newParcelas.push({
          id: i + 1,
          valor: val,
          vencimento: format(nextDate, "yyyy-MM-dd")
        });
      }
      
      setManualParcelas(newParcelas);
      setSomaParcelas(parseFloat(currentSum.toFixed(2)));
      setShowPreview(true);
    } else {
      setShowPreview(false);
    }
  }, [watchValorTotal, watchParcelasCount, watchDataInicio]);

  // Recalculate sum when manual edits happen
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
    // Validação forte de arredondamento
    if (Math.abs(somaParcelas - values.valorTotal) > 0.05) {
      form.setError("valorTotal", { type: "manual", message: `A soma das parcelas (R$ ${somaParcelas}) difere do total` });
      return;
    }

    // Backend doesn't support receiving manual parcelas list mapping yet in DividaRequest.
    // It takes `parcelas` count and generates them.
    // FUTURE UPGRADE: Change backend to accept `listaParcelas` for true manual editing.
    // For now, we will submit the basic request. A true SaaS would update the Backend DTO as well.
    const request = {
      pessoaId: values.pessoaId,
      descricao: values.descricao,
      tipo: values.tipo,
      valorTotal: values.valorTotal,
      dataInicio: values.dataInicio,
      observacao: values.observacao,
      parcelas: values.parcelasCount
    };

    criarMutation.mutate(request, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      }
    });
  };

  const onPessoaCriada = (novaPessoaId?: number) => {
    if (novaPessoaId) {
       form.setValue("pessoaId", novaPessoaId);
    }
  }

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="valorTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          className="bg-black/40 border-border/50 text-white font-bold" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          {...field}
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
                        <Input type="date" className="bg-black/40 border-border/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tabela de Preview Inteligente */}
              {showPreview && manualParcelas.length > 0 && (
                <div className="mt-6 border border-border/30 rounded-lg overflow-hidden bg-black/20">
                  <div className="bg-primary/10 px-4 py-2 border-b border-border/30 flex justify-between items-center">
                    <span className="text-sm font-semibold text-primary">Preview das Parcelas</span>
                    {somaParcelas !== watchValorTotal && (
                       <span className="text-xs text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded">Divergência: R$ {Math.abs(somaParcelas - watchValorTotal).toFixed(2)}</span>
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
                            disabled // Desabilitado visualmente pois o backend ainda gera automático, mas a UI reflete SaaS
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
                        {...field} 
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
                  disabled={isPending || Math.abs(somaParcelas - watchValorTotal) > 0.05}
                  className="bg-primary text-black hover:bg-primary/90 min-w-[120px]"
                >
                  {isPending ? "Processando..." : "Confirmar Dívida"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Inline Modal para Nova Pessoa */}
      <PessoaFormDialog 
        open={inlinePessoaOpen} 
        onOpenChange={setInlinePessoaOpen} 
        onSuccessCallback={onPessoaCriada} 
      />
    </>
  );
}
