"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { GastosMensaisReport } from "@/features/relatorios/components/GastosMensaisReport";

export default function RelatoriosPage() {
  return (
    <AppLayout>
      <div className="max-w-[1200px] mx-auto pb-10">
        <GastosMensaisReport />
      </div>
    </AppLayout>
  );
}
