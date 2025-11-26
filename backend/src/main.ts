/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { CorsService, GlobalExceptionFilter, ResponseInterceptor } from './modules/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get CorsService instance to access allowed origins
  const corsService = app.get(CorsService);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean | string) => void
    ) => {
      Logger.debug(`[CORS DEBUG] Incoming origin: ${origin}`);

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        Logger.debug('[CORS DEBUG] No origin provided, allowing request');
        return callback(null, true);
      }

      // Check if origin is allowed
      const isAllowed = corsService.isOriginAllowed(origin);
      Logger.debug(`[CORS DEBUG] Origin "${origin}" allowed: ${isAllowed}`);
      Logger.debug(`[CORS DEBUG] Allowed origins: ${corsService.getAllowedOrigins().join(', ')}`);

      if (isAllowed) {
        // CRITICAL: Return the origin string, not just true
        // This tells NestJS to set Access-Control-Allow-Origin to this specific origin
        Logger.debug(`[CORS DEBUG] Returning origin string to callback: ${origin}`);
        return callback(null, origin);
      }

      // Log rejected origins for debugging
      Logger.warn(`[CORS DEBUG] REJECTED origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
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
    customfavIcon: '/logo.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });
  */

  const port = process.env.PORT || 3004;
  Logger.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
  Logger.log(
    `🔗 Frontend CORS URLs: ${process.env.FRONTEND_URLS || 'http://localhost:3001,http://localhost:3003'}`
  );
  Logger.log(
    `🗃️  Database: ${process.env.DATABASE_URL ? 'Connected via env var' : 'Using default (ensure DATABASE_URL is set)'}`
  );
  Logger.log(
    `🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Using default (change in production)'}`
  );
  Logger.log(`🤖 AI Model: ${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}`);
  Logger.log(
    `🔑 Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured' : 'NOT SET - AI features may not work'}`
  );
  console.log('');
  await app.listen(port, '0.0.0.0');
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix} (bound to 0.0.0.0)`
  );
  // Logger.log(`📚 API Documentation is available at: http://localhost:${port}/api/docs`);
}

bootstrap();
