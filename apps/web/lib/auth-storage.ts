const KEY = 'three-way-match-token';

export const authStorage = {
  get: (): string | null =>
    typeof window === 'undefined' ? null : window.localStorage.getItem(KEY),
  set: (token: string): void => {
    if (typeof window !== 'undefined') window.localStorage.setItem(KEY, token);
  },
  clear: (): void => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
  },
};
