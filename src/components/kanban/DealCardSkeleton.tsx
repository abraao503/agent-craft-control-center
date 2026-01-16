import { Skeleton } from "@/components/ui/skeleton";

export const DealCardSkeleton = () => (
  <div className="rounded-md border p-3 bg-card shadow-sm relative">
    {/* Avatar no canto superior direito */}
    <div className="absolute top-2 right-2">
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>

    {/* Título */}
    <Skeleton className="h-4 w-3/4 mb-2" />

    {/* Descrição */}
    <Skeleton className="h-3 w-full mb-1" />
    <Skeleton className="h-3 w-2/3 mb-2" />

    {/* Data de vencimento */}
    <div className="mt-2 mb-2">
      <Skeleton className="h-3 w-24 mb-1" />
      <Skeleton className="h-6 w-32" />
    </div>

    {/* Valor e Cliente */}
    <div className="flex items-center justify-between mt-2 mb-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-24" />
    </div>

    {/* Botões de ação */}
    <div className="flex items-center gap-1 justify-end">
      <Skeleton className="h-7 w-7 rounded-md" />
      <Skeleton className="h-7 w-7 rounded-md" />
    </div>
  </div>
);
