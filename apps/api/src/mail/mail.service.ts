import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs';

type ReservationEmailData = {
  name: string;
  phone: string;
  email?: string;
  guests: number;
  date: string;
  time: string;
  message?: string;
  qrToken?: string;
};

type MailAttachment = {
  filename: string;
  path?: string;
  content?: Buffer;
  cid?: string;
  contentType?: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private readonly transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.strato.com',
    port: Number(process.env.MAIL_PORT || 465),
    secure: process.env.MAIL_SECURE !== 'false',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  private readonly fromName =
    process.env.MAIL_FROM_NAME || 'DaWu Sushi Fusion';

  private readonly fromEmail =
    process.env.MAIL_FROM_EMAIL ||
    process.env.MAIL_USER ||
    '';

  private readonly logoCid = 'dawu-email-logo';

  private readonly logoPath =
    process.env.MAIL_LOGO_PATH ||
    path.join(process.cwd(), 'assets', 'logo-email.png');

  private getFromAddress() {
    return `"${this.fromName}" <${this.fromEmail}>`;
  }

  private getLogoAttachment(): MailAttachment | null {
    if (!fs.existsSync(this.logoPath)) {
      this.logger.warn(
        `Email logo not found: ${this.logoPath}`,
      );

      return null;
    }

    return {
      filename: 'dawu-logo.png',
      path: this.logoPath,
      cid: this.logoCid,
      contentType: 'image/png',
    };
  }

  private getBaseAttachments(): MailAttachment[] {
    const logoAttachment = this.getLogoAttachment();

    return logoAttachment ? [logoAttachment] : [];
  }

  private layout(title: string, content: string) {
    const website =
      process.env.RESTAURANT_WEBSITE_URL ||
      'https://dawubeverwijk.nl';

    const hasLogo = fs.existsSync(this.logoPath);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>${title}</title>
</head>

<body style="margin:0;padding:0;background:#070504;">
  <div
    style="
      margin:0;
      padding:0;
      background:#070504;
      font-family:Arial,Helvetica,sans-serif;
      color:#ffffff;
    "
  >
    <div
      style="
        max-width:640px;
        margin:0 auto;
        padding:34px 18px;
      "
    >
      <div
        style="
          text-align:center;
          margin-bottom:28px;
        "
      >
        ${
          hasLogo
            ? `
          <img
            src="cid:${this.logoCid}"
            alt="DaWu Sushi Fusion"
            width="180"
            style="
              display:block;
              width:180px;
              max-width:100%;
              height:auto;
              margin:0 auto 18px;
              border:0;
              outline:none;
              text-decoration:none;
            "
          />
        `
            : `
          <div
            style="
              font-size:34px;
              font-weight:900;
              letter-spacing:8px;
              color:#ffffff;
            "
          >
            DAWU
          </div>
        `
        }

        <div
          style="
            color:#d6b15f;
            font-size:12px;
            letter-spacing:4px;
            text-transform:uppercase;
          "
        >
          Sushi Fusion
        </div>
      </div>

      <div
        style="
          background:#111111;
          border:1px solid #2a2a2a;
          border-radius:26px;
          padding:30px;
        "
      >
        <h1
          style="
            margin:0 0 22px;
            font-size:28px;
            line-height:1.2;
            color:#ffffff;
          "
        >
          ${title}
        </h1>

        ${content}
      </div>

      <div
        style="
          margin-top:24px;
          text-align:center;
          color:#888888;
          font-size:12px;
          line-height:1.7;
        "
      >
        DaWu Sushi Fusion<br />
        Beverwijk, Netherlands<br />

        <a
          href="${website}"
          style="
            color:#d6b15f;
            text-decoration:none;
          "
        >
          Visit website
        </a>

        <br /><br />

        This email was sent automatically.
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  private row(
    label: string,
    value?: string | number,
  ) {
    return `
<div
  style="
    padding:14px 0;
    border-bottom:1px solid #272727;
  "
>
  <div
    style="
      color:#888888;
      font-size:12px;
      text-transform:uppercase;
      letter-spacing:1.4px;
      margin-bottom:4px;
    "
  >
    ${label}
  </div>

  <div
    style="
      font-size:18px;
      font-weight:700;
      color:#ffffff;
    "
  >
    ${value || '-'}
  </div>
</div>`;
  }

  async sendNewReservationEmail(
    data: ReservationEmailData,
  ) {
    const html = this.layout(
      'New reservation',
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
      from: this.getFromAddress(),

      to:
        process.env.RESTAURANT_EMAIL ||
        this.fromEmail,

      replyTo:
        data.email ||
        process.env.RESTAURANT_EMAIL ||
        this.fromEmail,

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

      attachments: this.getBaseAttachments(),
    });
  }

  async sendCustomerReservationEmail(
    data: ReservationEmailData,
  ) {
    if (!data.email) {
      return;
    }

    let qrCodeBuffer: Buffer | null = null;

    if (data.qrToken) {
      const qrPayload = `DAWU:${data.qrToken}`;

      qrCodeBuffer = await QRCode.toBuffer(
        qrPayload,
        {
          type: 'png',
          width: 320,
          margin: 2,
          errorCorrectionLevel: 'H',
        },
      );
    }

    const html = this.layout(
      'Reservation confirmed',
      `
<p
  style="
    margin:0 0 22px;
    color:#d0d0d0;
    font-size:16px;
    line-height:1.7;
  "
>
  Dear
  <strong style="color:#ffffff;">
    ${data.name}
  </strong>,
  <br />

  Thank you for your reservation at DaWu Sushi Fusion.
  Your reservation is confirmed.
</p>

${this.row('Guests', data.guests)}
${this.row('Date', data.date)}
${this.row('Time', data.time)}

${
  qrCodeBuffer
    ? `
<div
  style="
    margin-top:24px;
    text-align:center;
    background:#ffffff;
    border-radius:20px;
    padding:20px;
  "
>
  <img
    src="cid:dawu-reservation-qr"
    alt="Reservation QR Code"
    width="220"
    height="220"
    style="
      display:block;
      width:220px;
      height:220px;
      margin:0 auto;
      border:0;
    "
  />

  <div
    style="
      margin-top:12px;
      color:#111111;
      font-size:13px;
      font-weight:700;
    "
  >
    Show this QR code at the restaurant
  </div>
</div>
`
    : ''
}

<p
  style="
    margin:24px 0 0;
    color:#d0d0d0;
    font-size:16px;
    line-height:1.7;
  "
>
  We look forward to welcoming you.
</p>
      `,
    );

    const attachments =
      this.getBaseAttachments();

    if (qrCodeBuffer) {
      attachments.push({
        filename: 'dawu-reservation-qr.png',
        content: qrCodeBuffer,
        cid: 'dawu-reservation-qr',
        contentType: 'image/png',
      });
    }

    await this.transporter.sendMail({
      from: this.getFromAddress(),

      to: data.email,

      replyTo:
        process.env.RESTAURANT_EMAIL ||
        this.fromEmail,

      subject:
        'Your reservation at DaWu is confirmed',

      text: `
Dear ${data.name},

Thank you for your reservation at DaWu Sushi Fusion.

Your reservation is confirmed.

Guests: ${data.guests}
Date: ${data.date}
Time: ${data.time}

Please show the QR code from this email when you arrive.

We look forward to welcoming you.

Kind regards,
DaWu Sushi Fusion
      `,

      html,
      attachments,
    });
  }

  async sendReservationCancelledEmail(data: {
    name: string;
    email?: string | null;
    startTime: Date;
    guests: number;
  }) {
    if (!data.email) {
      return;
    }

    const date =
      data.startTime.toLocaleDateString(
        'nl-NL',
      );

    const time =
      data.startTime.toLocaleTimeString(
        'nl-NL',
        {
          hour: '2-digit',
          minute: '2-digit',
        },
      );

    const html = this.layout(
      'Reservation cancelled',
      `
<p
  style="
    margin:0 0 22px;
    color:#d0d0d0;
    font-size:16px;
    line-height:1.7;
  "
>
  Dear
  <strong style="color:#ffffff;">
    ${data.name}
  </strong>,
  <br />

  Your reservation at DaWu Sushi Fusion has been cancelled.
</p>

${this.row('Guests', data.guests)}
${this.row('Date', date)}
${this.row('Time', time)}

<p
  style="
    margin:24px 0 0;
    color:#d0d0d0;
    font-size:16px;
    line-height:1.7;
  "
>
  If this was a mistake, please contact us.
</p>
      `,
    );

    await this.transporter.sendMail({
      from: this.getFromAddress(),

      to: data.email,

      replyTo:
        process.env.RESTAURANT_EMAIL ||
        this.fromEmail,

      subject:
        'Your reservation at DaWu has been cancelled',

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

      attachments: this.getBaseAttachments(),
    });
  }
}