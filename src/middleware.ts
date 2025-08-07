
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase-admin-sdk';
import type { AppUser } from '@/lib/types';


async function getUserFromToken(token: string): Promise<AppUser | null> {
    try {
        const decodedToken = await auth.verifyIdToken(token);
        const userRecord = await auth.getUser(decodedToken.uid);
        // This is a simplified version. You'd likely fetch your user profile
        // from Firestore here to get the role. For this example, we assume
        // the role is stored as a custom claim on the token.
        return {
            uid: userRecord.uid,
            email: userRecord.email || null,
            name: userRecord.displayName || 'Usuario',
            role: (decodedToken.role as AppUser['role']) || 'seller', // Default to seller if no role
            businessId: (decodedToken.businessId as string) || null,
        };
    } catch (error) {
        console.error("Error verifying token in middleware:", error);
        return null;
    }
}


export async function middleware(request: NextRequest) {
  const tokenCookie = request.cookies.get('firebaseIdToken');
  const token = tokenCookie?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login');
  const isDashboardPage = pathname.startsWith('/dashboard');

  // If there's a token and user is on the login page, redirect to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If the user is at the root and has a token, redirect to dashboard
  if (token && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If trying to access any page (including root) without a token, redirect to login
  // except for the login page itself
  if (!token && pathname !== '/login') {
     return NextResponse.redirect(new URL('/login', request.url));
  }

  // Otherwise, allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
