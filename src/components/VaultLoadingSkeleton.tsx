import { Skeleton } from "@/components/ui/skeleton";

export function VaultLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search Bar Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-11 w-full max-w-2xl" />
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Results Count Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Question Cards Skeleton */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-b border-border pb-6 space-y-4">
            {/* Question title */}
            <Skeleton className="h-6 w-3/4" />
            
            {/* Metadata */}
            <div className="flex gap-2 flex-wrap">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-14" />
            </div>
            
            {/* Tags */}
            <div className="flex gap-2 flex-wrap">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-14" />
            </div>
            
            {/* File name */}
            <Skeleton className="h-4 w-2/3" />
            
            {/* Answer */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}