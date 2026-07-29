'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="p-8">
      <h2 className="text-xl font-bold">Unable to load this match</h2>
      <Button className="mt-4" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
