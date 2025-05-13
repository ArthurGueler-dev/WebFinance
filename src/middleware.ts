import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// Variável para controlar se o agendador já foi inicializado
let schedulerInitialized = false;
// Adicionar controle para inicializar apenas uma vez por dia
let lastSchedulerInitMonth = '';

// Esta função é chamada para todas as rotas configuradas no matcher
export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const secret = process.env.NEXTAUTH_SECRET || '1fdf494e16c686aead0cc60a34d530de';
  
  console.log(`Middleware - Verificando autenticação para: ${request.nextUrl.pathname}`);
  
  try {
    // Usando a secret diretamente para garantir que o token seja decodificado corretamente
    const token = await getToken({
      req: request,
      secret: secret
    });
    
    const isAuthenticated = !!token;
    
    // Para debugging
    console.log(`Middleware - Rota: ${request.nextUrl.pathname}, Autenticado: ${isAuthenticated}`);
    if (token) {
      console.log(`Middleware - Token encontrado para usuário: ${token.email}`);
    }
    
    const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                        request.nextUrl.pathname.startsWith('/register');

    // Redirect to login if trying to access dashboard without auth
    if (isDashboardRoute && !isAuthenticated) {
      console.log('Redirecionando para login: usuário não autenticado tentando acessar dashboard');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', encodeURI(request.nextUrl.pathname));
      return NextResponse.redirect(loginUrl);
    }

    // Redirect to dashboard if authenticated and trying to access auth routes
    if (isAuthRoute && isAuthenticated) {
      console.log('Redirecionando para dashboard: usuário autenticado tentando acessar página de login');
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  } catch (error) {
    console.error('Erro no middleware:', error);
    // Em caso de erro na autenticação, permitir que a solicitação continue
    // para que o sistema de autenticação possa lidar com isso
  }

  // Verificar se o scheduler deve ser inicializado
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
  
  // Inicializar somente se for um novo mês ou se nunca inicializamos
  if (!schedulerInitialized || lastSchedulerInitMonth !== currentMonth) {
    try {
      // Verificar se não é um acesso direto à página principal ou 
      // se é uma requisição de API ou asset
      if (request.nextUrl.pathname !== '/' && 
          request.nextUrl.pathname !== '/dashboard' ||
          request.headers.get('sec-fetch-dest') !== 'document' || 
          request.nextUrl.pathname.includes('/api/') ||
          request.nextUrl.pathname.includes('/_next/')) {
        // Pular inicialização para requisições que não são carregamento inicial da página
        return NextResponse.next();
      }
      
      // Somente inicializar uma vez por mês
      if (lastSchedulerInitMonth === currentMonth) {
        console.log(`Middleware: Agendador já inicializado este mês (${currentMonth})`);
        return NextResponse.next();
      }
      
      // Chamar o endpoint para inicializar o agendador
      // Usando a mesma origem da requisição para garantir que funcione em qualquer ambiente
      const origin = request.nextUrl.origin;
      console.log(`Middleware: Inicializando o agendador para o mês ${currentMonth}`);
      
      const initResponse = await fetch(`${origin}/api/init-scheduler`, {
        method: 'GET',
        headers: {
          'x-middleware-preflight': 'middleware'
        }
      });
      
      if (initResponse.ok) {
        schedulerInitialized = true;
        lastSchedulerInitMonth = currentMonth;
        console.log(`Middleware: Agendador inicializado com sucesso para o mês ${currentMonth}!`);
      } else {
        console.error('Middleware: Falha ao inicializar agendador.');
      }
    } catch (error) {
      console.error('Middleware: Erro ao inicializar agendador:', error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas exceto:
     * 1. Todas com /api/auth/* (auth de next-auth)
     * 2. Todas com _next/ (assets Next.js)
     * 3. Todas as imagens estáticas (favicon, etc)
     * 4. Endpoint de inicialização do agendador (para evitar loops infinitos)
     */
    '/((?!api/auth|api/init-scheduler|_next/static|_next/image|favicon.ico).*)',
  ],
}; 