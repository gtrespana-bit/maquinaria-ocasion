export default function Loading() {
  return (
    <div className="shell max-w-[1180px] py-8 md:py-10" aria-busy="true">
      <div className="mb-6 flex items-start justify-between gap-4 border border-line bg-[#FBFAF5] p-5">
        <div className="flex-1 space-y-2.5">
          <div className="skeleton h-5 w-44" />
          <div className="skeleton h-3 w-60" />
          <div className="skeleton h-3 w-36" />
        </div>
        <div className="skeleton h-8 w-28" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 md:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="space-y-2 bg-paper px-4 py-4">
            <div className="skeleton h-5 w-12" />
            <div className="skeleton h-2.5 w-20" />
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <div className="hidden w-56 shrink-0 space-y-2 lg:block">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton h-8 w-full" />
          ))}
        </div>
        <div className="flex-1 space-y-3 border border-line bg-[#FBFAF5] p-6">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton h-14 w-14" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-3/4" />
                <div className="skeleton h-2.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
