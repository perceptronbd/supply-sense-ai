/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { GlobalExceptionFilter, ResponseInterceptor } from './modules/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Enable global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false, // Validate optional fields when provided
      validateCustomDecorators: true,
    })
  );

  // Apply global exception filter for consistent error handling
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Apply global response interceptor for consistent success responses
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Setup Swagger documentation - temporarily disabled due to circular dependency
  /*
  const config = new DocumentBuilder()
    .setTitle('SupplySense Management API')
    .setDescription(
      'Comprehensive API for managing supply chain operations including authentication, purchase requests, purchase orders, goods receipts, material requisitions, request forms, manufacturing lists, formulas, and AI services.'
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication operations')
    .addTag('ai', 'AI services and automation')
    .addTag('app', 'Application information')
    .addTag('purchase-request', 'Purchase Request operations')
    .addTag('purchase-order', 'Purchase Order operations')
    .addTag('goods-receipt', 'Goods Receipt operations')
    .addTag('material-requisition', 'Material Requisition operations')
    .addTag('request-form', 'Request Form operations')
    .addTag('manufacturing-list', 'Manufacturing List operations')
    .addTag('formula', 'Formula operations')
    .addBearerAuth()
    .addServer(`http://localhost:${process.env.PORT || 3000}/`, 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: false,
    include: [],
    deepScanRoutes: true,
    // Options to handle circular dependencies
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  // Clean up circular references in schema
  const cleanCircularReferences = (obj: any, seen = new WeakSet()): any => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (seen.has(obj)) return '[Circular Reference]';
    
    seen.add(obj);
    
    if (Array.isArray(obj)) {
      return obj.map(item => cleanCircularReferences(item, seen));
    }
    
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cleaned[key] = cleanCircularReferences(obj[key], seen);
      }
    }
    
    seen.delete(obj);
    return cleaned;
  };

  // Apply cleaning to the document
  const cleanedDocument = cleanCircularReferences(document);
  SwaggerModule.setup('api/docs', app, cleanedDocument, {
    customSiteTitle: 'SupplySense API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });
  */

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
  // Logger.log(`📚 API Documentation is available at: http://localhost:${port}/api/docs`);
}

bootstrap();
