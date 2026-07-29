'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { ApiSuccessResponse } from '@three-way-match/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import { useAuthContext } from '@/providers/auth-provider';
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});
type Values = z.infer<typeof schema>;
export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@example.com', password: 'admin' },
  });
  const auth = useAuthContext();
  const router = useRouter();
  const submit = async (values: Values): Promise<void> => {
    try {
      const { data } = await apiClient.post<ApiSuccessResponse<{ token: string }>>(
        '/auth/login',
        values,
      );
      auth.login(data.data.token);
      router.push('/dashboard');
    } catch {
      setError('root', { message: 'Login failed. Check that the API is running.' });
    }
  };
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-md">
        <p className="text-sm font-semibold text-emerald-700">PROCUREMENT OPERATIONS</p>
        <h1 className="mt-2 text-2xl font-bold">Three-Way Match Engine</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to reconcile purchase documents.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(submit)}>
          <label className="block text-sm font-medium">
            Email
            <Input className="mt-1" type="email" {...register('email')} />
          </label>
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          <label className="block text-sm font-medium">
            Password
            <Input className="mt-1" type="password" {...register('password')} />
          </label>
          {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
