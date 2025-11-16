import { Skeleton } from "@/components/ui/skeleton";

export function ActivityItemSkeleton() {
  return (
    <div className="space-y-2 border-b pb-4">
      <div className="flex items-start gap-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function ActivityListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <ActivityItemSkeleton key={index} />
      ))}
    </>
  );
}
