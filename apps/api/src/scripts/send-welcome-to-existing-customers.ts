import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

const DELAY_BETWEEN_EMAILS_MS = 1000;

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function bootstrap(): Promise<void> {
  const confirmArgument = process.argv.includes('--confirm');

  if (!confirmArgument) {
    console.error(
      'Рассылка не запущена. Для подтверждения используй параметр --confirm.',
    );
    console.error(
      'Команда: npx ts-node src/scripts/send-welcome-to-existing-customers.ts --confirm',
    );

    process.exitCode = 1;
    return;
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const prisma = app.get(PrismaService);
  const mailService = app.get(MailService);

  try {
    const customers = await prisma.customer.findMany({
      where: {
        deletedAt: null,
        isBlocked: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`Найдено клиентов: ${customers.length}`);

    if (customers.length === 0) {
      console.log('Активных клиентов для рассылки нет.');
      return;
    }

    let successful = 0;
    let failed = 0;

    for (let index = 0; index < customers.length; index += 1) {
      const customer = customers[index];

      console.log(
        `[${index + 1}/${customers.length}] Отправка: ${customer.email}`,
      );

      try {
        await mailService.sendCustomerWelcomeEmail({
          name: customer.name,
          email: customer.email,
        });

        successful += 1;

        console.log(`Успешно: ${customer.email}`);
      } catch (error) {
        failed += 1;

        console.error(
          `Ошибка отправки на ${customer.email}:`,
          error instanceof Error ? error.message : String(error),
        );
      }

      if (index < customers.length - 1) {
        await sleep(DELAY_BETWEEN_EMAILS_MS);
      }
    }

    console.log('');
    console.log('Рассылка завершена.');
    console.log(`Успешно отправлено: ${successful}`);
    console.log(`Ошибок: ${failed}`);
    console.log(`Всего обработано: ${customers.length}`);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error: unknown) => {
  console.error(
    'Критическая ошибка рассылки:',
    error instanceof Error ? error.stack : String(error),
  );

  process.exitCode = 1;
});