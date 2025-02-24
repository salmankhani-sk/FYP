// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const protectedPaths = ['/uploads', '/recipe-generator', '/shopping-list', '/nutrition', '/ingredient'];
  const { pathname } = req.nextUrl;

  if (protectedPaths.includes(pathname)) {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      const loginUrl = new URL('/login', req.nextUrl.origin);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/uploads', '/recipe-generator', '/shopping-list', '/nutrition', '/ingredient'],
};
