"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { RecorrenciaList } from "./components/recorrencia-list";
import { Button } from "@/components/ui/button";
import { PlusCircle, Repeat } from "lucide-react";
import Link from "next/link";

export default function RecorrenciasPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Transações Recorrentes</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Repeat size={18} className="text-primary" />
              Gestão de contas e assinaturas que se repetem.
            </p>
          </div>
          <Link href="/lancamentos">
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(var(--primary),0.4)]">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Recorrência
            </Button>
          </Link>
        </div>

        <div className="mt-8">
          <RecorrenciaList />
        </div>
      </div>
    </AppLayout>
  );
}
