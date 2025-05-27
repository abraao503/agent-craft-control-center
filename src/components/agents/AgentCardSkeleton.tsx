import { Skeleton } from "../ui/skeleton";

const AgentCardSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-4 bg-card">
          {/* Cabeçalho do card */}
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>

          {/* Corpo do card */}
          <div className="space-y-2 py-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>

          {/* Rodapé do card */}
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentCardSkeleton;
