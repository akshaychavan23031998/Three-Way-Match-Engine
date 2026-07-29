'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ApiError, apiClient } from '@/lib/api-client';
import { authStorage } from '@/lib/auth-storage';
import { tokenLoginSchema } from '@/lib/validation';
import { useAuth } from '@/hooks/use-auth';

type Values = { token: string };

export default function LoginPage() {
  const [visible, setVisible] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(tokenLoginSchema), defaultValues: { token: '' } });
  const submit = async ({ token }: Values): Promise<void> => {
    authStorage.set(token);
    try {
      await apiClient.validateToken();
      auth.login(token);
      router.replace('/dashboard');
    } catch (error) {
      authStorage.clear();
      setError('root', {
        message:
          error instanceof ApiError && error.status === 401
            ? 'The bearer token is invalid or expired.'
            : 'The token could not be validated. Check that the API is available.',
      });
    }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4 sm:p-6">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <ShieldCheck className="size-9 text-emerald-600" aria-hidden />
        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Procurement operations
        </p>
        <h1 className="mt-1 text-2xl font-bold">Three-Way Match Engine</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter the static bearer token configured for the API.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(submit)}>
          <div>
            <label htmlFor="token" className="text-sm font-medium">
              Bearer token
            </label>
            <div className="relative mt-1">
              <Input
                id="token"
                type={visible ? 'text' : 'password'}
                autoComplete="current-password"
                aria-invalid={Boolean(errors.token)}
                className="pr-11"
                {...register('token')}
              />
              <button
                type="button"
                aria-label={visible ? 'Hide token' : 'Show token'}
                onClick={() => setVisible((value) => !value)}
                className="absolute inset-y-0 right-0 px-3 text-slate-500 focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.token && <p className="mt-1 text-xs text-red-600">{errors.token.message}</p>}
          </div>
          {errors.root && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {errors.root.message}
            </p>
          )}
          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Validating…' : 'Continue'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
