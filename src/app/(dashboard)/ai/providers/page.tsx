import Link from 'next/link';
import { ExternalLink, Search } from 'lucide-react';
import { authService } from '@/modules/auth/auth.service';
import { aiProviderService } from '@/modules/ai-provider/ai-provider.service';
import { toggleAiProviderAction } from '@/modules/ai-provider/ai-provider.actions';
import { CreateProviderForm } from '@/modules/ai-provider/components/create-provider-form';
import { StatusBadge } from '@/shared/components/status-badge';

export const dynamic = 'force-dynamic';

export default async function AiProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await authService.requireSession();
  const params = await searchParams;
  const search = params.q?.trim() || undefined;
  const providers = await aiProviderService.listAll({ search });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Providers</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Catalog of AI platforms.{' '}
            <Link href="/ai/accounts" className="underline">
              Manage registered accounts
            </Link>
          </p>
        </div>

        <form method="GET" className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            <input
              name="q"
              defaultValue={search ?? ''}
              placeholder="Search providers..."
              className="h-8 rounded-md border bg-transparent pl-8 pr-3 text-xs outline-none"
            />
          </div>
          <button
            type="submit"
            className="h-8 rounded-md border px-3 text-xs font-medium hover:bg-[hsl(var(--accent))]"
          >
            Search
          </button>
        </form>
      </div>

      <CreateProviderForm />

      <div className="overflow-x-auto rounded-lg border bg-[hsl(var(--card))]">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs text-[hsl(var(--muted-foreground))]">
            <tr>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Website</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {providers.map((p) => (
              <tr key={p.id} className="hover:bg-[hsl(var(--accent))]/40">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-[hsl(var(--muted-foreground))]">
                  {p.code}
                </td>
                <td className="px-4 py-3 text-xs">
                  <a
                    href={p.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    {p.websiteUrl} <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </td>
                <td className="px-4 py-3 text-right">
                  <form
                    action={async () => {
                      'use server';
                      await toggleAiProviderAction(p.id, !p.isActive);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-md border px-2.5 py-1 text-xs hover:bg-[hsl(var(--accent))]"
                    >
                      {p.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
