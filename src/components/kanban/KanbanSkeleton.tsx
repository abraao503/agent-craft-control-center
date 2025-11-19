import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DealCardSkeleton } from "./DealCardSkeleton";

const KanbanColumnSkeleton = () => (
  <div className="min-w-[320px] w-[320px] max-w-[360px]">
    <Card className="flex flex-col flex-1 bg-background/60 border-border overflow-hidden">
      <CardHeader className="py-3 bg-muted/40 border-b border-border">
        <CardTitle className="flex flex-col justify-between text-sm">
          {/* Nome da coluna */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Totalizadores */}
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </CardTitle>

        {/* Campo de busca */}
        <div className="mt-2">
          <Skeleton className="h-8 w-full" />
        </div>
      </CardHeader>

      <CardContent className="p-2">
        <ScrollArea className="h-[calc(100vh-340px)] pr-1">
          <div className="space-y-2">
            {/* 3 cards skeleton */}
            <DealCardSkeleton />
            <DealCardSkeleton />
            <DealCardSkeleton />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  </div>
);

export const KanbanSkeleton = ({ columns = 4 }: { columns?: number }) => (
  <div className="overflow-x-auto">
    <div className="flex items-start gap-4 h-[calc(100vh-220px)] w-max pr-2">
      {Array.from({ length: columns }).map((_, i) => (
        <KanbanColumnSkeleton key={i} />
      ))}
    </div>
  </div>
);
