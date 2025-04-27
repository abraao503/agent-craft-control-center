import { Skeleton } from "../ui/skeleton";

const AgentCardSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 2 }, (_, index) => (
        <Skeleton
          className="h-full flex flex-col bg-gray-200"
          style={{ minHeight: "200px" }}
          key={index}
        ></Skeleton>
      ))}
    </div>
  );
};

export default AgentCardSkeleton;
