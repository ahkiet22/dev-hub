import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--background))] px-4 text-center">
      <p className="font-mono text-xs text-[hsl(var(--muted-foreground))]">404</p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
        The requested resource does not exist or you do not have access to it.
      </p>
      <Link
        href="/overview"
        className="mt-4 rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-xs font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90"
      >
        Back to Overview
      </Link>
    </div>
  );
}
