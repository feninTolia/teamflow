import { Skeleton } from '@/components/ui/skeleton';

const ThreadSidebarSkeleton = () => {
  return (
    <div className="w-[30rem] border-l flex flex-col h-full">
      <div className="border-b h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <Skeleton className="size-5" />
          <Skeleton className="h-5 w-16" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="size-8" />
        </div>
      </div>

      {/* Main Message */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b bg-muted/20">
          <div className="flex space-x-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>

        {/* Thread Replies */}
        <div className="p-2">
          <div className="px-2 mb-6">
            <Skeleton className="h-3 w-16" />
          </div>

          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="flex space-x-3 px-2" key={index}>
                <Skeleton className="size-6 rounded-full" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>

                  <div className="space-y-2">
                    {/* <Skeleton className="h-4 w-full" /> */}
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Skeleton */}
      <div className="border-t p-4">
        <Skeleton className="h-56  w-full rounded-md" />
      </div>
    </div>
  );
};

export default ThreadSidebarSkeleton;
