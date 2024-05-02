import 'dotenv/config';
import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';

interface EmailContent {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}
@Injectable()
export class EmailService {
  async sendEmail(
    emailContent: EmailContent = {
      from: 'default-sender@example.com',
      to: 'default-recipient@example.com',
      subject: 'Default Subject',
      text: 'Text',
      html: '<p>Text</p>',
    },
  ) {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email options
    const mailOptions = {
      ...emailContent,
    };

    // comment out actual sending of the email
    // const info = await transporter.sendMail(mailOptions);

    return { message: 'Message sent!' };
  }
}
