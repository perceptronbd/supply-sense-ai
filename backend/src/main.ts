/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Enable global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false, // Allow extra properties for now
    })
  );

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Supply Chain AI Management API')
    .setDescription(
      'Comprehensive API for managing supply chain operations including purchase requests, purchase orders, goods receipts, material requisitions, request forms, manufacturing lists, and formulas.'
    )
    .setVersion('1.0')
    .addTag('purchase-request', 'Purchase Request operations')
    .addTag('purchase-order', 'Purchase Order operations')
    .addTag('goods-receipt', 'Goods Receipt operations')
    .addTag('material-requisition', 'Material Requisition operations')
    .addTag('request-form', 'Request Form operations')
    .addTag('manufacturing-list', 'Manufacturing List operations')
    .addTag('formula', 'Formula operations')
    .addServer(
      `http://localhost:${process.env.PORT || 3000}/`,
      'Development server'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Supply Chain AI API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `📚 API Documentation is available at: http://localhost:${port}/api/docs`
  );
}

bootstrap();
