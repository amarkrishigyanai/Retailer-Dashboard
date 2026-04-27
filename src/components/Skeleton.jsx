// Pulse skeleton primitives — mint green theme
const base = 'animate-pulse rounded-xl';
const skBg  = { backgroundColor: '#A8E7CB' }; // mint green pulse

export const SkeletonBox = ({ className = '' }) => (
  <div className={`${base} ${className}`} style={skBg} />
);

export const SkeletonStatCards = ({ count = 4 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${count} gap-6`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-6 flex justify-between items-center" style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid rgba(62,207,142,0.15)' }}>
        <div className="space-y-2">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-8 w-16" />
        </div>
        <SkeletonBox className="h-12 w-12 rounded-2xl" />
      </div>
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 6, cols = 5 }) => (
  <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid rgba(62,207,142,0.15)', overflow: 'hidden' }}>
    <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(62,207,142,0.12)' }}>
      <SkeletonBox className="h-4 w-40" />
    </div>
    <table className="w-full">
      <thead style={{ backgroundColor: '#E8F8F1' }}>
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="px-4 py-3"><SkeletonBox className="h-3 w-full" /></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c} className="px-4 py-4"><SkeletonBox className="h-4 w-full" /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const SkeletonCardGrid = ({ count = 6, cols = 3 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-5`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-5 space-y-3" style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid rgba(62,207,142,0.15)' }}>
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-3 w-3/4" />
            <SkeletonBox className="h-3 w-1/2" />
          </div>
        </div>
        <SkeletonBox className="h-3 w-full" />
        <SkeletonBox className="h-3 w-5/6" />
      </div>
    ))}
  </div>
);

export const SkeletonHeader = () => (
  <div className="space-y-2">
    <SkeletonBox className="h-7 w-56" />
    <SkeletonBox className="h-4 w-80" />
  </div>
);
