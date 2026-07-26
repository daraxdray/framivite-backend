import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Ensure uploads directories exist
  const uploadsDir = join(process.cwd(), 'uploads');
  ['banners', 'frames', 'selfies', 'composed'].forEach((dir) => {
    const fullPath = join(uploadsDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  // Serve static files from /uploads
  app.use('/uploads', express.static(uploadsDir));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Framivite Backend API running on http://localhost:${port}`);
}
bootstrap();
