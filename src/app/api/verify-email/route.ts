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
    const storedToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: hashedToken,
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
      // Excluir tokens expirados
      await prisma.verificationToken.delete({
        where: { 
          identifier_token: {
            identifier: storedToken.identifier,
            token: storedToken.token
          }
        }
      });
      
      return NextResponse.json(
        { error: 'Token expirado' },
        { status: 401 }
      );
    }

    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Marcar o email como verificado
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() }
    });

    // Remover o token usado
    await prisma.verificationToken.delete({
      where: { 
        identifier_token: {
          identifier: storedToken.identifier,
          token: storedToken.token
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Email verificado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 