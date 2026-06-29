import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import env from '../config/env';

// Konfigurasi transporter (tipe sudah dikonversi number/boolean di config/env)
const transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,        // number
    secure: env.mail.secure,    // boolean (true untuk 465)
    auth: {
        user: env.mail.username,
        pass: env.mail.password
    }
} as SMTPTransport.Options);

// Fungsi untuk mengirim email
export const sendMail = async (to: string, subject: string, text: string, html?: string) => {
    const mailOptions = {
        from: `"${env.mail.fromName}" <${env.mail.fromAddress}>`,
        to: to,
        subject: subject,
        text: text,
        html: html,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};