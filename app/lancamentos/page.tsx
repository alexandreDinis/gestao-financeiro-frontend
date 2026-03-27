import { Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LancamentosContainer } from "./components/lancamentos-container";

/**
 * We wrap the container in Suspense because it uses useSearchParams
 * which opts the whole route into dynamic rendering.
 */
export default function LancamentosPage() {
  return (
    <AppLayout>
      <Suspense fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <LancamentosContainer />
      </Suspense>
    </AppLayout>
  );
}
