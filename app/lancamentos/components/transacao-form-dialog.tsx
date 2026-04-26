"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransacaoForm } from "./transacao-form";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
}

export function TransacaoFormDialog({ open, onOpenChange, initialData }: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-border/40 sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            {initialData ? "Editar Lançamento" : "Novo Lançamento"}
          </DialogTitle>
          <DialogDescription>
            {initialData 
              ? "Atualize os detalhes do seu lançamento." 
              : "Preencha os dados abaixo para registrar uma transação."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-2">
          <TransacaoForm 
            onSuccess={() => onOpenChange(false)} 
            initialData={initialData} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
