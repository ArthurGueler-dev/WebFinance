import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
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

// Função de envio de email de verificação
async function sendAccountVerificationEmail(to: string, verificationUrl: string, name: string = 'Usuário') {
  const subject = 'WebFinance - Confirmação de Conta';
  
  // HTML estilizado para o email
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333; text-align: center;">Bem-vindo ao WebFinance!</h2>
      <p>Olá ${name},</p>
      <p>Obrigado por se cadastrar no WebFinance. Para confirmar sua conta e começar a usar nosso sistema, clique no botão abaixo:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirmar Minha Conta</a>
      </div>
      <p>Este link é válido por 24 horas. Se você não criou uma conta, por favor ignore este email.</p>
      <p>Atenciosamente,<br>Equipe WebFinance</p>
    </div>
  `;

  // Versão em texto plano
  const text = `
    Olá ${name},
    Obrigado por se cadastrar no WebFinance. Para confirmar sua conta e começar a usar nosso sistema, acesse o link abaixo:
    ${verificationUrl}
    Este link é válido por 24 horas. Se você não criou uma conta, por favor ignore este email.
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
    
    console.log('Email de verificação enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erro ao enviar email de verificação:', error);
    throw error;
  }
}

// Função para validar email com regex mais completo
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export async function POST(req: Request) {
  try {
    console.log('Iniciando registro de usuário');
    const { name, email, password } = await req.json();
    console.log('Dados recebidos:', { name, email, passwordLength: password?.length });

    // Validações básicas
    if (!name || !email || !password) {
      console.log('Dados inválidos:', { name, email, passwordExists: !!password });
      return NextResponse.json(
        { message: 'Nome, email e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    // Validação de formato de email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: 'O formato do email é inválido' },
        { status: 400 }
      );
    }

    // Validação de senha
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Check if user with email already exists
    console.log('Verificando se o email já existe:', email);
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.log('Usuário já existe:', email);
        return NextResponse.json(
          { message: 'Usuário com este email já existe.' },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error('Erro ao verificar usuário existente:', error);
      return NextResponse.json(
        { message: 'Erro ao verificar se o usuário já existe.' },
        { status: 500 }
      );
    }

    // Hash password
    console.log('Gerando hash da senha');
    const hashedPassword = await hash(password, 10);

    // Criar token de verificação de email
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Data de expiração (24 horas)
    const expires = new Date(Date.now() + 24 * 3600000);

    // Create user
    console.log('Criando usuário');
    try {
      // Criar o usuário com emailVerified como null (não verificado)
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          emailVerified: null, // Indica que o email ainda não foi verificado
        },
      });

      // Armazenar o token de verificação
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: hashedToken,
          expires
        }
      });

      // Construir URL de verificação
      const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

      try {
        // Enviar email de confirmação
        await sendAccountVerificationEmail(
          email,
          verificationUrl,
          name
        );
        console.log('Email de verificação enviado para:', email);
      } catch (emailError) {
        console.error('Erro ao enviar email de verificação:', emailError);
        // Prosseguir mesmo com erro no envio de email
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      console.log('Usuário criado com sucesso:', userWithoutPassword.id);
      
      return NextResponse.json(
        { 
          message: 'Usuário criado com sucesso. Verifique seu email para ativar sua conta.',
          user: userWithoutPassword,
          verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return NextResponse.json(
        { message: 'Erro ao criar o usuário no banco de dados.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { message: 'Ocorreu um erro durante o registro.' },
      { status: 500 }
    );
  }
} 