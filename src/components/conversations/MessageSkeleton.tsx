import React from "react";

type MessageSkeletonProps = {
  isCustomer?: boolean;
};

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({ isCustomer = false }) => {
  return (
    <div className={`flex mb-4 ${isCustomer ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isCustomer
            ? "bg-primary/10"
            : "bg-muted/50"
        }`}
      >
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-4 w-20 bg-muted-foreground/10 rounded animate-pulse" />
          <div className="h-3 w-12 bg-muted-foreground/10 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-48 bg-muted-foreground/10 rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted-foreground/10 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}; 