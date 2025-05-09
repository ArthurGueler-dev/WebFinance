import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email e token são obrigatórios' },
        { status: 400 }
      );
    }

    // Hash o token para comparar com o armazenado
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Buscar o token no banco de dados
    const storedToken = await prisma.verificationToken.findUnique({
      where: {
        identifier: email,
        token: hashedToken
      }
    });

    // Verificar se o token existe e não expirou
    if (!storedToken) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 404 }
      );
    }

    if (new Date() > storedToken.expires) {
      return NextResponse.json(
        { error: 'Token expirado' },
        { status: 401 }
      );
    }

    // Token válido
    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Erro ao verificar token de redefinição:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 