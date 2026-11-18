export default function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div
      aria-label="Loading live streamers"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col overflow-hidden rounded-2xl border border-[#B7A9CC]/12 bg-[#170B2A]"
        >
          <div className="aspect-video w-full bg-[#241242] motion-safe:animate-pulse" />
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#241242] shrink-0 motion-safe:animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-[#241242] motion-safe:animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-[#241242] motion-safe:animate-pulse" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3.5 w-full rounded bg-[#241242] motion-safe:animate-pulse" />
              <div className="h-3.5 w-4/5 rounded bg-[#241242] motion-safe:animate-pulse" />
            </div>
            <div className="mt-1 h-11 w-full rounded-xl bg-[#241242] motion-safe:animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
