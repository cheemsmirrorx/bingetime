import { GridSkeleton, RowSkeleton } from "@/components/content/Skeletons";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen pt-20 pb-16 space-y-10">
      <div className="h-[55vh] max-h-[540px] w-full bg-zinc-900/60 animate-pulse" />
      <div className="max-w-[1600px] mx-auto px-4 md:px-12 space-y-10">
        <RowSkeleton />
        <GridSkeleton count={6} />
      </div>
    </div>
  );
}

