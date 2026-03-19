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
}

export function TransacaoFormDialog({ open, onOpenChange }: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-border/40 sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            Novo Lançamento
          </DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para registrar uma transação.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-2">
          <TransacaoForm onSuccess={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
