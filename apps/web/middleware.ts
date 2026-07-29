import { NextResponse, type NextRequest } from 'next/server';
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}
// Authentication uses localStorage and is therefore enforced after hydration by AuthProvider.
export const config = {
  matcher: ['/dashboard/:path*', '/documents/:path*', '/masters/:path*'],
};
