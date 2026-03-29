'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-5 w-2/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 2 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  );
}
