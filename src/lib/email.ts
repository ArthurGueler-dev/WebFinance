import nodemailer from 'nodemailer';

// IMPORTANTE: Substitua estas credenciais com suas próprias!
// Em um ambiente de produção, você deve usar variáveis de ambiente
const EMAIL_USER = 'seu-email@gmail.com'; // Substitua pelo seu email
const EMAIL_PASSWORD = 'sua-senha-de-app'; // Substitua pela sua senha de app

// Configuração do transporte de email com valores fixos
export const emailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

// Email padrão do sistema
export const defaultFrom = `WebFinance <${EMAIL_USER}>`;

// Template para email de recuperação de senha
export async function sendPasswordResetEmail(
  to: string, 
  resetUrl: string,
  name: string = 'Usuário'
) {
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
      <div style="font-size: 12px; color: #666; margin-top: 20px; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
        Este é um email automático, por favor não responda.
      </div>
    </div>
  `;

  // Versão em texto plano para clientes de email que não suportam HTML
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
      from: defaultFrom,
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

// Template para email de confirmação de conta
export async function sendAccountVerificationEmail(
  to: string, 
  verificationUrl: string,
  name: string = 'Usuário'
) {
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
      <div style="font-size: 12px; color: #666; margin-top: 20px; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
        Este é um email automático, por favor não responda.
      </div>
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
      from: defaultFrom,
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