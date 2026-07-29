import { AppShell } from '@/components/layout/app-shell';
import { TopTabs } from '@/components/layout/top-tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
export default async function MatchPage({ params }: { params: Promise<{ poNumber: string }> }) {
  const { poNumber } = await params;
  return (
    <AppShell>
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div>
          <p className="text-xs font-semibold text-slate-500">PURCHASE ORDER</p>
          <h1 className="text-xl font-bold">{decodeURIComponent(poNumber)}</h1>
        </div>
        <Badge className="bg-amber-100 text-amber-800">Awaiting documents</Badge>
      </header>
      <TopTabs />
      <div className="grid gap-4 p-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="font-semibold">Line-item match</h2>
          <p className="mt-12 text-center text-sm text-slate-500">
            Item table will appear after documents are parsed.
          </p>
        </Card>
        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold">Document details</h2>
            <p className="mt-3 text-sm text-slate-500">Select an associated document.</p>
          </Card>
          <Card className="min-h-72">
            <h2 className="font-semibold">Document preview</h2>
            <p className="mt-3 text-sm text-slate-500">Preview unavailable.</p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
