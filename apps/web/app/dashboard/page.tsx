'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
export default function DashboardPage() {
  const [po, setPo] = useState('');
  const router = useRouter();
  return (
    <main className="mx-auto max-w-6xl p-8">
      <p className="text-sm font-semibold text-emerald-700">THREE-WAY MATCH ENGINE</p>
      <h1 className="mt-2 text-3xl font-bold">Procurement dashboard</h1>
      <p className="mt-2 text-slate-500">Review POs, invoices, GRNs, and matching outcomes.</p>
      <Card className="mt-8">
        <h2 className="font-semibold">Open a purchase order</h2>
        <div className="mt-4 flex gap-3">
          <Input
            value={po}
            onChange={(event) => setPo(event.target.value)}
            placeholder="PO number"
          />
          <Button
            disabled={!po.trim()}
            onClick={() => router.push(`/dashboard/${encodeURIComponent(po.trim())}`)}
          >
            Open match
          </Button>
        </div>
      </Card>
      <div className="mt-4 flex gap-3">
        <Button>Upload document</Button>
        <Button className="bg-slate-800 hover:bg-slate-900" onClick={() => router.push('/masters')}>
          SKU Master management
        </Button>
      </div>
    </main>
  );
}
