import { cn } from '@/shared/utils/cn';

const STATUS_STYLES: Record<string, { dot: string; badge: string }> = {
  ACTIVE: {
    dot: 'bg-emerald-500',
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
  },
  HEALTHY: {
    dot: 'bg-emerald-500',
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
  },
  DEGRADED: {
    dot: 'bg-amber-500',
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
  },
  UNHEALTHY: {
    dot: 'bg-red-500',
    badge: 'border-red-500/30 bg-red-500/10 text-red-500',
  },
  UNREACHABLE: {
    dot: 'bg-red-500',
    badge: 'border-red-500/30 bg-red-500/10 text-red-500',
  },
  INVALID_RESPONSE: {
    dot: 'bg-orange-500',
    badge: 'border-orange-500/30 bg-orange-500/10 text-orange-500',
  },
  INACTIVE: {
    dot: 'bg-zinc-400',
    badge: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400',
  },
  UNKNOWN: {
    dot: 'bg-zinc-400',
    badge: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400',
  },
  ARCHIVED: {
    dot: 'bg-slate-400',
    badge: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.UNKNOWN!;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] font-medium',
        style.badge,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {status}
    </span>
  );
}
