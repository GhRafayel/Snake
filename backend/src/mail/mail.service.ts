import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ContactMessageDto } from 'src/dto/contact-message.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
        private mailerService: MailerService,
        private configService : ConfigService
  ) {}

  async sendResetCode(email: string, code: string) {

    await this.mailerService.sendMail({

      to: email,
      subject: 'Password Reset Code',
      text: `Your reset code is: ${code}`,
      html: `<b>Your reset code is: ${code}</b>`,
    });
  }

  async sendContactMessage(body: ContactMessageDto) {
    await this.mailerService.sendMail({
      to: this.configService.get("PROJECT_EMAIL"),
      subject: `New Message from user ${body.Username}`,
      replyTo: body.Email, 
      text: `Name: ${body.Username}\nEmail: ${body.Email}\nMessage:\n${body.message}`,
      html: `
        <p><b>Name:</b> ${body.Username}</p>
        <p><b>Email:</b> ${body.Email}</p>
        <p><b>Message:</b></p>
        <p>${body.message}</p>
      `,
    });
  }
}