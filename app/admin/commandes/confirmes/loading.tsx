import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (

    
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 rounded-md" />
        <Skeleton className="h-28 rounded-md" />
        <Skeleton className="h-28 rounded-md" />
        <Skeleton className="h-28 rounded-md" />
      </div>
      <div className="rounded-md border border-slate-800">
        <Skeleton className="h-10 rounded-t-md" />
        <Skeleton className="h-96 rounded-b-md" />
      </div>
    </div>
  )
}
