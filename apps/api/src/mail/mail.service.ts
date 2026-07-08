import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

type ReservationEmailData = {
  name: string;
  phone: string;
  email?: string;
  guests: number;
  date: string;
  time: string;
  message?: string;
};

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  async sendNewReservationEmail(data: ReservationEmailData) {
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

  async sendCustomerReservationEmail(data: ReservationEmailData) {
    if (!data.email) return;

    await this.transporter.sendMail({
      from: `"DaWu Sushi Fusion" <${process.env.GMAIL_USER}>`,
      to: data.email,
      subject: 'Your reservation request at DaWu',
      text: `
Dear ${data.name},

Thank you for your reservation request at DaWu Sushi Fusion.

We have received your request:

Guests: ${data.guests}
Date: ${data.date}
Time: ${data.time}

Your reservation is currently pending. Our team will contact you if confirmation or changes are needed.

Kind regards,
DaWu Sushi Fusion
      `,
    });
  }
}