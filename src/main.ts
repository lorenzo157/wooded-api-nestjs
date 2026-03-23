import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { urlencoded, json } from 'express';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('HTTP');

  app.use(cookieParser());

  // Log every request: method, URL, user, and response time
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      if (req.method === 'OPTIONS') return;
      const duration = Date.now() - start;
      const userId = req.user?.idUser ?? 'anonymous';
      logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - user: ${userId}`);
    });
    next();
  });

  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3001').split(',');

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Swagger)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    methods: 'GET,POST,PUT,PATCH,DELETE',
    allowedHeaders: 'Content-Type, Authorization, ngrok-skip-browser-warning',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Wooded Project')
    .setDescription('API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  await app.listen(3000);
}
bootstrap();
