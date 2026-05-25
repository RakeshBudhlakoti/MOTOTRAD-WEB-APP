import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/reset-password', '/auth/forgot-password'];

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userStr = request.cookies.get('user')?.value;
  const { pathname } = request.nextUrl;

  // 1. Check if the route is public
  if (publicRoutes.includes(pathname)) {
    if (token) {
      // Redirect to dashboard if already logged in
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 2. Protected Routes Logic
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. RBAC Logic (Role-Based Access Control)
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const userRole = user.role?.name?.toLowerCase() || user.role?.toLowerCase() || 'user';
      
      // Global restriction: Only super_admin, admin, and seller roles are allowed in the Admin Portal
      const allowedGlobalRoles = ['super_admin', 'admin', 'seller'];
      if (!allowedGlobalRoles.includes(userRole)) {
        // Clear token and user cookies and force redirect to login
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        response.cookies.delete('token');
        response.cookies.delete('user');
        return response;
      }
      
      // Define Role Access Map
      const routeAccessMap: Record<string, string[]> = {
        '/settings': ['super_admin', 'admin'],
        '/roles': ['super_admin', 'admin'],
        '/users': ['super_admin', 'admin'],
        '/orders': ['super_admin', 'admin', 'seller'],
        '/payments': ['super_admin', 'admin'],
        '/auctions': ['super_admin', 'admin', 'seller'],
        '/products': ['super_admin', 'admin', 'seller'],
      };

      // Check if the current route has restrictions
      for (const [route, allowedRoles] of Object.entries(routeAccessMap)) {
        if (pathname.startsWith(route)) {
          if (!allowedRoles.includes(userRole)) {
            // Unauthorized access attempt
            return NextResponse.redirect(new URL('/unauthorized', request.url));
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse user cookie for RBAC', error);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

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
