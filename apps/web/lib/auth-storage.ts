const KEY = 'three-way-match-token';
export const authStorage = {
  get: (): string | null => (typeof window === 'undefined' ? null : localStorage.getItem(KEY)),
  set: (token: string): void => localStorage.setItem(KEY, token),
  clear: (): void => localStorage.removeItem(KEY),
};
