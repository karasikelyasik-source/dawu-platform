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

  private restaurantHtml(title: string, content: string) {
    return `
      <div style="margin:0;padding:0;background:#070504;font-family:Arial,sans-serif;color:#ffffff;">
        <div style="max-width:620px;margin:0 auto;padding:32px 18px;">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="font-size:34px;font-weight:900;letter-spacing:8px;">DAWU</div>
            <div style="margin-top:8px;color:#d6b15f;font-size:12px;letter-spacing:4px;text-transform:uppercase;">
              Sushi Fusion
            </div>
          </div>

          <div style="background:#111;border:1px solid #2a2a2a;border-radius:24px;padding:28px;">
            <h1 style="margin:0 0 20px;font-size:26px;line-height:1.2;color:#ffffff;">
              ${title}
            </h1>

            ${content}
          </div>

          <div style="margin-top:24px;text-align:center;color:#888;font-size:12px;line-height:1.6;">
            DaWu Sushi Fusion<br/>
            This email was sent automatically.
          </div>
        </div>
      </div>
    `;
  }

  private row(label: string, value?: string | number) {
    return `
      <div style="padding:14px 0;border-bottom:1px solid #272727;">
        <div style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">
          ${label}
        </div>
        <div style="font-size:18px;font-weight:700;color:#ffffff;">
          ${value || '-'}
        </div>
      </div>
    `;
  }

  async sendNewReservationEmail(data: ReservationEmailData) {
    const html = this.restaurantHtml(
      `New reservation`,
      `
        ${this.row('Name', data.name)}
        ${this.row('Phone', data.phone)}
        ${this.row('Email', data.email || '-')}
        ${this.row('Guests', data.guests)}
        ${this.row('Date', data.date)}
        ${this.row('Time', data.time)}
        ${this.row('Message', data.message || '-')}
      `,
    );

    await this.transporter.sendMail({
      from: `"DaWu Reservations" <${process.env.GMAIL_USER}>`,
      to: process.env.RESTAURANT_EMAIL,
      replyTo: data.email || process.env.GMAIL_USER,
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
      html,
    });
  }

  async sendCustomerReservationEmail(data: ReservationEmailData) {
    if (!data.email) return;

    const html = this.restaurantHtml(
      `Reservation confirmed`,
      `
        <p style="margin:0 0 22px;color:#d0d0d0;font-size:16px;line-height:1.7;">
          Dear <strong style="color:#ffffff;">${data.name}</strong>,<br/>
          Thank you for your reservation at DaWu Sushi Fusion. Your reservation is confirmed.
        </p>

        ${this.row('Guests', data.guests)}
        ${this.row('Date', data.date)}
        ${this.row('Time', data.time)}

        <p style="margin:24px 0 0;color:#d0d0d0;font-size:16px;line-height:1.7;">
          We look forward to welcoming you.
        </p>
      `,
    );

    await this.transporter.sendMail({
      from: `"DaWu Sushi Fusion" <${process.env.GMAIL_USER}>`,
      to: data.email,
      replyTo: process.env.RESTAURANT_EMAIL || process.env.GMAIL_USER,
      subject: 'Your reservation at DaWu is confirmed',
      text: `
Dear ${data.name},

Thank you for your reservation at DaWu Sushi Fusion.

Your reservation is confirmed.

Guests: ${data.guests}
Date: ${data.date}
Time: ${data.time}

We look forward to welcoming you.

Kind regards,
DaWu Sushi Fusion
      `,
      html,
    });
  }

  async sendReservationCancelledEmail(data: {
    name: string;
    email?: string | null;
    startTime: Date;
    guests: number;
  }) {
    if (!data.email) return;

    const date = data.startTime.toLocaleDateString('nl-NL');
    const time = data.startTime.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = this.restaurantHtml(
      `Reservation cancelled`,
      `
        <p style="margin:0 0 22px;color:#d0d0d0;font-size:16px;line-height:1.7;">
          Dear <strong style="color:#ffffff;">${data.name}</strong>,<br/>
          Your reservation at DaWu Sushi Fusion has been cancelled.
        </p>

        ${this.row('Guests', data.guests)}
        ${this.row('Date', date)}
        ${this.row('Time', time)}

        <p style="margin:24px 0 0;color:#d0d0d0;font-size:16px;line-height:1.7;">
          If this was a mistake, please contact us.
        </p>
      `,
    );

    await this.transporter.sendMail({
      from: `"DaWu Sushi Fusion" <${process.env.GMAIL_USER}>`,
      to: data.email,
      replyTo: process.env.RESTAURANT_EMAIL || process.env.GMAIL_USER,
      subject: 'Your reservation at DaWu has been cancelled',
      text: `
Dear ${data.name},

Your reservation at DaWu Sushi Fusion has been cancelled.

Guests: ${data.guests}
Date: ${date}
Time: ${time}

If this was a mistake, please contact us.

Kind regards,
DaWu Sushi Fusion
      `,
      html,
    });
  }
}