import { NextResponse } from 'next/server';

const ADMIN_LOGIN_PATH = '/admin';
const AUTH_COOKIE_NAMES = ['admin-session', 'admin_token', 'adminToken'];

function hasAdminSession(request) {
  return AUTH_COOKIE_NAMES.some((cookieName) => request.cookies.get(cookieName)?.value);
}

export function proxy(request) {
  if (hasAdminSession(request)) {
    return NextResponse.next();
  }

  const redirectUrl = new URL(ADMIN_LOGIN_PATH, request.url);
  redirectUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ['/dashboard/:path*'],
};