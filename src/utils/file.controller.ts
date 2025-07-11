import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { EnvVars } from '../config-loader';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';

@Controller('api/files')
export class FileController {
  private readonly storagePath: string;

  constructor(private readonly configService: ConfigService) {
    this.storagePath = this.configService.get(EnvVars.localStoragePath);
  }

  @Get('*')
  async serveFile(@Param('0') filePath: string, @Res() res: Response) {
    try {
      const fullPath = path.join(this.storagePath, filePath);

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        throw new NotFoundException('File not found');
      }

      // Get file stats to check if it's actually a file
      const stats = fs.statSync(fullPath);
      if (!stats.isFile()) {
        throw new NotFoundException('File not found');
      }

      // Set appropriate content type
      const mimeType = mime.lookup(fullPath) || 'application/octet-stream';
      res.set('Content-Type', mimeType);

      // Set cache headers for better performance
      res.set('Cache-Control', 'public, max-age=31536000'); // 1 year

      // Stream the file
      const fileStream = fs.createReadStream(fullPath);
      fileStream.pipe(res);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('File not found');
    }
  }
}
