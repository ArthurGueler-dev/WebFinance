import { compare } from 'bcrypt';
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

// Fallback values if environment variables aren't set
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3001';
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '1fdf494e16c686aead0cc60a34d530de';

console.log('NextAuth config loaded with URL:', NEXTAUTH_URL);

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
  
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login', // Custom error page
  },
  debug: true, // Sempre ativar debugging para identificar problemas
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('Authorizing user:', credentials?.email);
          
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials');
            throw new Error('Email and password are required');
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          console.log('User found:', !!user);

          if (!user || !user.password) {
            console.log('User not found or password not set');
            throw new Error('Invalid email or password');
          }

          const isPasswordValid = await compare(credentials.password, user.password);
          console.log('Password valid:', isPasswordValid);

          if (!isPasswordValid) {
            throw new Error('Invalid email or password');
          }

          console.log('Authentication successful for user:', user.id);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        console.log('JWT callback: User data added to token');
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        console.log('Session callback: User ID added to session');
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback - URL:', url, 'BaseURL:', baseUrl);
      
      // Se for uma URL interna, permitir redirecionamento
      if (url.startsWith(baseUrl) || url.startsWith('/')) {
        const targetPath = url.startsWith('/') ? `${baseUrl}${url}` : url;
        console.log('Redirecionando para URL interna:', targetPath);
        return targetPath;
      }
      
      // Caso contrário, redirecionar para a dashboard
      console.log('Redirecionando para dashboard (URL externa ou inválida)');
      return `${baseUrl}/dashboard`;
    }
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 