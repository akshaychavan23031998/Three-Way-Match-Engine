import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary';

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'border border-transparent bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-500 disabled:bg-emerald-300 disabled:text-white',
  secondary:
    'border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 active:bg-slate-100 focus-visible:ring-slate-500 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500',
};

export const buttonClassName = ({
  variant = 'primary',
  className = '',
}: {
  variant?: ButtonVariant;
  className?: string;
} = {}): string =>
  `inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${buttonVariants[variant]} ${className}`;

export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={buttonClassName({ variant, className })} {...props} />;
}
