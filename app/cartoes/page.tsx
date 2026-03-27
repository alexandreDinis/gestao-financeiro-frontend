import { AppLayout } from "@/components/layout/AppLayout";
import { CartoesList } from "@/features/cartoes/components/cartoes-list";
import { CreditCard } from "lucide-react";

export default function CartoesPage() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <CreditCard className="text-primary" size={32} />
              Cartões de Cartão
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus cartões de crédito, faturas e limites.
            </p>
          </div>
        </div>

        <CartoesList />
      </div>
    </AppLayout>
  );
}
