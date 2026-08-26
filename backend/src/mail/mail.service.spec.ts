import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { ContactMessageDto } from 'src/dto/contact-message.dto';

describe('MailService', () => {
  let service: MailService;
  let mailerService: { sendMail: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    mailerService = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };
    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mailerService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendResetCode', () => {
    it('sends an email to the given address with the reset code', async () => {
      await service.sendResetCode('user@example.com', '123456');

      expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Password Reset Code',
        text: 'Your reset code is: 123456',
        html: '<b>Your reset code is: 123456</b>',
      });
    });

    it('propagates errors thrown by the mailer', async () => {
      const error = new Error('SMTP down');
      mailerService.sendMail.mockRejectedValueOnce(error);

      await expect(
        service.sendResetCode('user@example.com', '123456'),
      ).rejects.toThrow('SMTP down');
    });
  });

  describe('sendContactMessage', () => {
    const body: ContactMessageDto = {
      Username: 'Rafayel',
      Email: 'rafayel@example.com',
      message: 'Hello there',
    } as ContactMessageDto;

    it('sends the contact message to the configured project email', async () => {
      configService.get.mockReturnValue('project@example.com');

      await service.sendContactMessage(body);

      expect(configService.get).toHaveBeenCalledWith('PROJECT_EMAIL');
      expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'project@example.com',
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
    });

    it('propagates errors thrown by the mailer', async () => {
      configService.get.mockReturnValue('project@example.com');
      const error = new Error('SMTP down');
      mailerService.sendMail.mockRejectedValueOnce(error);

      await expect(service.sendContactMessage(body)).rejects.toThrow(
        'SMTP down',
      );
    });
  });
});
