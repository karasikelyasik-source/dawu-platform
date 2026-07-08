import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  async sendNewReservationEmail(data: {
    name: string;
    phone: string;
    email?: string;
    guests: number;
    date: string;
    time: string;
    message?: string;
  }) {
    await this.transporter.sendMail({
      from: `"DaWu Reservations" <${process.env.GMAIL_USER}>`,
      to: process.env.RESTAURANT_EMAIL,
      subject: `New reservation - ${data.name}`,
      text: `
New reservation

Name: ${data.name}
Phone: ${data.phone}
Email: ${data.email || '-'}
Guests: ${data.guests}
Date: ${data.date}
Time: ${data.time}
Message: ${data.message || '-'}
      `,
    });
  }
}