"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { api } from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCriarOrcamentoMutation, useAtualizarOrcamentoMutation } from "../hooks/use-orcamentos-mutation";
import { OrcamentoResumoResponse } from "../types";
import { Categoria, TipoCategoria } from "@/types";

const formSchema = z.object({
  categoriaId: z.coerce.number().min(1, "Selecione uma categoria"),
  mesAno: z.string().min(7, "Selecione o mês"),
  limite: z.coerce.number().positive("O limite deve ser maior que zero"),
});

type FormValues = z.infer<typeof formSchema>;

interface OrcamentoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento?: OrcamentoResumoResponse; // Passado se for edição
  mesContexto: number; // Mês atual da view
  anoContexto: number; // Ano atual da view
}

export function OrcamentoFormDialog({ open, onOpenChange, orcamento, mesContexto, anoContexto }: OrcamentoFormDialogProps) {
  const criarMutation = useCriarOrcamentoMutation();
  const atualizarMutation = useAtualizarOrcamentoMutation(mesContexto, anoContexto);
  
  const isEditing = !!orcamento;
  const isPending = criarMutation.isPending || atualizarMutation.isPending;

  // Busca categorias apenas de DESPESA
  const { data: categorias, isLoading: loadingCats } = useQuery<Categoria[]>({
    queryKey: ["categorias", "DESPESA"],
    queryFn: async () => {
      const { data } = await api.get("/categorias", { params: { tipo: "DESPESA" } });
      return data.data;
    },
    enabled: open, // Só carrega quando abrir
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      categoriaId: 0,
      mesAno: `${anoContexto}-${mesContexto.toString().padStart(2, "0")}`,
      limite: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (orcamento) {
        form.reset({
          categoriaId: orcamento.categoriaId,
          mesAno: `${anoContexto}-${mesContexto.toString().padStart(2, "0")}`,
          limite: orcamento.limite,
        });
      } else {
        form.reset({
          categoriaId: 0,
          mesAno: `${anoContexto}-${mesContexto.toString().padStart(2, "0")}`,
          limite: 0,
        });
      }
    }
  }, [open, orcamento, mesContexto, anoContexto, form]);

  const onSubmit = (values: FormValues) => {
    const [anoStr, mesStr] = values.mesAno.split("-");
    const ano = parseInt(anoStr, 10);
    const mes = parseInt(mesStr, 10);

    const requestPayload = {
      categoriaId: values.categoriaId,
      mes,
      ano,
      limite: values.limite,
    };

    if (isEditing && orcamento) {
      atualizarMutation.mutate({ id: orcamento.orcamentoId, request: requestPayload }, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        }
      });
    } else {
      criarMutation.mutate(requestPayload, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] glass-panel border-border/40">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? "Editar Meta de Gasto" : "Definir Nova Meta de Gasto"}
          </DialogTitle>
          <DialogDescription>
            Defina o teto máximo que você deseja gastar com esta categoria no mês.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            
            <FormField
              control={form.control}
              name="categoriaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria (Despesa)</FormLabel>
                  <Select 
                    value={field.value ? field.value.toString() : ""} 
                    onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full h-10 px-3 py-2 bg-black/40 border-border/50 text-white focus:ring-1 focus:ring-primary">
                        <SelectValue placeholder={loadingCats ? "Carregando..." : "Selecione a categoria"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-950 border border-border/40 text-white max-h-[250px]">
                      {categorias?.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()} className="focus:bg-primary/20 focus:text-white cursor-pointer hover:text-white">
                          <span className="flex items-center gap-2">
                            {c.cor && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.cor }} />}
                            {c.nome}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mesAno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês / Ano</FormLabel>
                    <FormControl>
                      <Input 
                        type="month" 
                        className="bg-black/40 border-border/50 text-white focus:border-primary/50" 
                        {...field} 
                        disabled={isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="limite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite Máximo (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        className="bg-black/40 border-border/50 text-white font-bold focus:border-primary/50" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-primary text-black hover:bg-primary/90 min-w-[120px]"
              >
                {isPending ? "Salvando..." : "Salvar Meta"}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
