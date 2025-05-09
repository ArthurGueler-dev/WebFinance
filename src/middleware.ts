import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// Esta função é chamada para todas as rotas configuradas no matcher
export async function middleware(request: NextRequest) {
  // Usando a secret diretamente para garantir que o token seja decodificado corretamente
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || '1fdf494e16c686aead0cc60a34d530de'
  });
  
  const isAuthenticated = !!token;
  
  // Para debugging
  console.log(`Middleware - Rota: ${request.nextUrl.pathname}, Autenticado: ${isAuthenticated}`);
  
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                      request.nextUrl.pathname.startsWith('/register');

  // Redirect to login if trying to access dashboard without auth
  if (isDashboardRoute && !isAuthenticated) {
    console.log('Redirecionando para login: usuário não autenticado tentando acessar dashboard');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if authenticated and trying to access auth routes
  if (isAuthRoute && isAuthenticated) {
    console.log('Redirecionando para dashboard: usuário autenticado tentando acessar página de login');
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}; 