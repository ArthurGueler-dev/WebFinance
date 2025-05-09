import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const { email, token, password } = await request.json();

    if (!email || !token || !password) {
      return NextResponse.json(
        { error: 'Email, token e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar tamanho mínimo da senha
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
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

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Atualizar a senha do usuário
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Remover o token usado
    await prisma.verificationToken.delete({
      where: {
        identifier: email,
        token: hashedToken
      }
    });

    // Senha atualizada com sucesso
    return NextResponse.json({ 
      success: true,
      message: 'Senha atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 