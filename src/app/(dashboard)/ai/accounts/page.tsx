import Link from 'next/link';
import { Bot, ExternalLink, Search } from 'lucide-react';
import { authService } from '@/modules/auth/auth.service';
import { aiProviderService } from '@/modules/ai-provider/ai-provider.service';
import { aiAccountService } from '@/modules/ai-account/ai-account.service';
import {
  deleteAiAccountAction,
  toggleAiAccountAction,
} from '@/modules/ai-account/ai-account.actions';
import { CreateAccountForm } from '@/modules/ai-account/components/create-account-form';
import { CopyEmailButton } from '@/modules/ai-account/components/copy-email-button';
import { StatusBadge } from '@/shared/components/status-badge';

export const dynamic = 'force-dynamic';

export default async function AiAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; providerId?: string }>;
}) {
  const { user } = await authService.requireSession();
  const params = await searchParams;
  const search = params.q?.trim() || undefined;
  const providerId = params.providerId?.trim() || undefined;

  const [providers, accounts] = await Promise.all([
    aiProviderService.listAll({ onlyActive: true }),
    aiAccountService.listByUser(user.id, { search, providerId }),
  ]);

  const grouped = new Map<
    string,
    { providerName: string; websiteUrl: string; items: typeof accounts }
  >();
  for (const acc of accounts) {
    const group = grouped.get(acc.providerId) ?? {
      providerName: acc.providerName,
      websiteUrl: acc.providerWebsiteUrl,
      items: [],
    };
    group.items.push(acc);
    grouped.set(acc.providerId, group);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Accounts</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Track emails registered across AI platforms (no passwords or API keys stored).{' '}
            <Link href="/ai/providers" className="underline">
              Manage Providers
            </Link>
          </p>
        </div>

        <form method="GET" className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            <input
              name="q"
              defaultValue={search ?? ''}
              placeholder="Search email or note..."
              className="h-8 rounded-md border bg-transparent pl-8 pr-3 text-xs outline-none"
            />
          </div>
          <select
            name="providerId"
            defaultValue={providerId ?? ''}
            className="h-8 rounded-md border bg-[hsl(var(--card))] px-2.5 text-xs outline-none"
          >
            <option value="">All providers</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-8 rounded-md border px-3 text-xs font-medium hover:bg-[hsl(var(--accent))]"
          >
            Filter
          </button>
        </form>
      </div>

      <CreateAccountForm providers={providers} />

      {grouped.size === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-[hsl(var(--card))] py-12 text-center">
          <Bot className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
          <p className="mt-2 text-sm font-medium">No AI accounts registered</p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Register your first AI provider email above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([pid, group]) => (
            <div key={pid} className="rounded-lg border bg-[hsl(var(--card))]">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-sm font-semibold">
                  {group.providerName} ({group.items.length})
                </h2>
                <a
                  href={group.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  Open Provider <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="divide-y">
                {group.items.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-mono text-xs font-medium">
                          {acc.email}
                        </span>
                        <StatusBadge status={acc.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </div>
                      {acc.note && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {acc.note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <CopyEmailButton email={acc.email} />
                      <form
                        action={async () => {
                          'use server';
                          await toggleAiAccountAction(acc.id, !acc.isActive);
                        }}
                      >
                        <button
                          type="submit"
                          className="h-7 rounded border px-2 text-[11px] hover:bg-[hsl(var(--accent))]"
                        >
                          {acc.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </form>
                      <form
                        action={async () => {
                          'use server';
                          await deleteAiAccountAction(acc.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="h-7 rounded border border-red-500/30 px-2 text-[11px] text-red-500 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
