import { existsSync } from 'node:fs';
import path from 'node:path';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UploadDocumentModal } from '@/components/documents/upload-document-modal';
import { Button, buttonClassName } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { apiClient } from '@/lib/api-client';

describe('shared action styling', () => {
  it('keeps secondary actions readable and preserves their click behavior', () => {
    const onClick = vi.fn();
    render(
      <Button type="button" variant="secondary" onClick={onClick}>
        Refresh
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Refresh' });
    expect(button).toHaveClass('bg-white', 'text-slate-800', 'border-slate-300');
    expect(button).toHaveClass('focus-visible:ring-slate-500');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('uses the shared primary density for link-style actions such as Add SKU', () => {
    const classes = buttonClassName();
    expect(classes).toContain('inline-flex');
    expect(classes).toContain('px-4');
    expect(classes).toContain('py-2');
    expect(classes).toContain('text-sm');
    expect(classes).toContain('leading-5');
  });
});

describe('pagination presentation and behavior', () => {
  it('uses readable secondary styles and prevents disabled page changes', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={1} onPageChange={onPageChange} />);

    const previous = screen.getByRole('button', { name: 'Previous' });
    const next = screen.getByRole('button', { name: 'Next' });
    for (const button of [previous, next]) {
      expect(button).toBeDisabled();
      expect(button).toHaveClass('text-slate-800', 'disabled:text-slate-500');
      fireEvent.click(button);
    }
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('preserves previous and next page changes when enabled', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={3} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  });
});

describe('upload modal secondary action', () => {
  it('keeps Cancel non-submitting, readable, and behaviorally isolated', () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const onClose = vi.fn();
    const upload = vi.spyOn(apiClient, 'uploadDocument');

    render(
      <QueryClientProvider client={queryClient}>
        <UploadDocumentModal open onClose={onClose} />
      </QueryClientProvider>,
    );

    const cancel = screen.getByRole('button', { name: 'Cancel' });
    expect(cancel).toHaveAttribute('type', 'button');
    expect(cancel).toHaveClass('bg-white', 'text-slate-800', 'border-slate-300');
    fireEvent.click(cancel);
    expect(onClose).toHaveBeenCalledOnce();
    expect(upload).not.toHaveBeenCalled();
  });
});

describe('application metadata assets', () => {
  it('provides a Next.js App Router favicon', () => {
    expect(existsSync(path.resolve(process.cwd(), 'app/icon.svg'))).toBe(true);
  });
});
