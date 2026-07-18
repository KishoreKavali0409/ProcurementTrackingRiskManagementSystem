'use client';

import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={clsx("animate-pulse rounded bg-enterprise-200 dark:bg-enterprise-800", className)} />
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-3 border-b border-enterprise-200 dark:border-enterprise-800 px-4">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-8" />
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="p-4 rounded border border-enterprise-200 dark:border-enterprise-800 bg-surface shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
