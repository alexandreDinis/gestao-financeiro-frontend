"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useCriarPessoaMutation, useAtualizarPessoaMutation } from "../hooks/use-pessoas-mutation";
import { Pessoa } from "../types";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().optional(),
  observacao: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PessoaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoaParams?: Pessoa; // Se passado, é modo de edição
  onSuccessCallback?: (pessoaCriadaId?: number) => void; // Para auto-selecionar no Inline Creation
}

export function PessoaFormDialog({ open, onOpenChange, pessoaParams, onSuccessCallback }: PessoaFormDialogProps) {
  const criarMutation = useCriarPessoaMutation();
  const atualizarMutation = useAtualizarPessoaMutation();

  const isEditing = !!pessoaParams;
  const isPending = criarMutation.isPending || atualizarMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      observacao: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (pessoaParams) {
        form.reset({
          nome: pessoaParams.nome,
          telefone: pessoaParams.telefone || "",
          observacao: pessoaParams.observacao || "",
        });
      } else {
        form.reset({ nome: "", telefone: "", observacao: "" });
      }
    }
  }, [open, pessoaParams, form]);

  const onSubmit = (values: FormValues) => {
    if (isEditing) {
      atualizarMutation.mutate(
        { id: pessoaParams.id, request: values },
        { 
          onSuccess: () => {
            onOpenChange(false);
            if (onSuccessCallback) onSuccessCallback(pessoaParams.id);
          }
        }
      );
    } else {
      criarMutation.mutate(values, {
        onSuccess: (data) => {
          onOpenChange(false);
          if (onSuccessCallback && data) onSuccessCallback(data.id);
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass-panel border-border/40">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? "Editar Contato" : "Novo Contato"}
          </DialogTitle>
          <DialogDescription>
             Adicione ou edite os dados da pessoa que está atrelada às dívidas.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" className="bg-black/40 border-border/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" className="bg-black/40 border-border/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais..." 
                      className="bg-black/40 border-border/50 resize-none" 
                      rows={3}
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
                disabled={isPending}
                className="bg-primary text-black hover:bg-primary/90 min-w-[100px]"
              >
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
