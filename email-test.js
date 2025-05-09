const nodemailer = require('nodemailer');

// Coloque suas credenciais diretamente aqui para testar
const EMAIL_USER = 'seu-email@gmail.com'; // IMPORTANTE: Substitua pelo seu email do Gmail
const EMAIL_PASS = 'sua-senha-de-app';    // IMPORTANTE: Substitua pela senha de app que você gerou

async function testEmail() {
  try {
    // Configuração do transporte de email
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    // Testar conexão
    console.log('Testando conexão SMTP...');
    const verify = await transporter.verify();
    console.log('Conexão SMTP verificada:', verify);

    // Enviar email de teste
    console.log('Enviando email de teste...');
    const info = await transporter.sendMail({
      from: `WebFinance <${EMAIL_USER}>`,
      to: EMAIL_USER, // Envia para o próprio email
      subject: 'Teste WebFinance',
      text: 'Este é um email de teste do WebFinance.',
      html: '<b>Este é um email de teste do WebFinance.</b>',
    });
    
    console.log('Email enviado com sucesso:', info.messageId);
  } catch (error) {
    console.error('Erro no teste de email:', error);
  }
}

testEmail(); 