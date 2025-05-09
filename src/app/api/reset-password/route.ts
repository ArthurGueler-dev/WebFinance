import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Configuração Mailtrap (segura para testes)
const emailTransporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "seu_usuario_mailtrap", // Substitua pelo usuário fornecido pelo Mailtrap
    pass: "sua_senha_mailtrap"    // Substitua pela senha fornecida pelo Mailtrap
  }
});

// Função de envio de email diretamente neste arquivo
async function sendPasswordResetEmail(to: string, resetUrl: string, name: string = 'Usuário') {
  const subject = 'WebFinance - Redefinição de Senha';
  
  // HTML estilizado para o email
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333; text-align: center;">Redefinição de Senha</h2>
      <p>Olá ${name},</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta no WebFinance.</p>
      <p>Clique no botão abaixo para definir uma nova senha:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Redefinir Senha</a>
      </div>
      <p>Este link é válido por 1 hora. Se você não solicitou esta redefinição, ignore este email.</p>
      <p>Atenciosamente,<br>Equipe WebFinance</p>
    </div>
  `;

  // Versão em texto plano
  const text = `
    Olá ${name},
    Recebemos uma solicitação para redefinir a senha da sua conta no WebFinance.
    Para redefinir sua senha, acesse o link abaixo:
    ${resetUrl}
    Este link é válido por 1 hora. Se você não solicitou esta redefinição, ignore este email.
    Atenciosamente,
    Equipe WebFinance
  `;

  try {
    const info = await emailTransporter.sendMail({
      from: 'webfinance@example.com', // Qualquer email funciona com Mailtrap
      to,
      subject,
      text,
      html,
    });
    
    console.log('Email de redefinição enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erro ao enviar email de redefinição:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o email existe
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Para segurança, não informamos se o email existe ou não
      return NextResponse.json({ 
        success: true,
        message: 'Se o email estiver registrado, você receberá instruções para redefinir sua senha.' 
      });
    }

    // Gerar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Data de expiração (1 hora)
    const expires = new Date(Date.now() + 3600000);

    // Armazenar o token no banco de dados
    await prisma.verificationToken.upsert({
      where: { 
        // Utilizamos o compound unique identifier_token para o upsert funcionar
        identifier_token: {
          identifier: email,
          token: hashedToken
        }
      },
      update: {
        expires
      },
      create: {
        identifier: email,
        token: hashedToken,
        expires
      }
    });

    // Construir URL de redefinição
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Enviar email com o link de redefinição
    try {
      await sendPasswordResetEmail(
        email, 
        resetUrl, 
        user.name || 'Usuário'
      );
      
      console.log('Email de redefinição enviado para:', email);
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      // Mesmo com falha no envio, não revelamos isso ao usuário por segurança
    }

    // Resposta de sucesso
    return NextResponse.json({ 
      success: true,
      message: 'Se o email estiver registrado, você receberá instruções para redefinir sua senha.',
      // Em desenvolvimento, retornar o link de redefinição para testes
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
    });
  } catch (error) {
    console.error('Erro ao processar solicitação de redefinição de senha:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 