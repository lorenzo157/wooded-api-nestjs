import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvVars } from '../config-loader';
import { IFileStorageService, FileUploadResult } from './interfaces/file-storage.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalFileStorageService implements IFileStorageService {
  private readonly storagePath: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.storagePath = this.configService.get(EnvVars.localStoragePath);
    this.baseUrl = this.configService.get(EnvVars.baseUrl) ;

    // Ensure the storage directory exists
    this.ensureStorageDirectory();
  }

  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  async uploadFile(fileData: string, filePath: string): Promise<FileUploadResult> {
    try {
      // Decode base64 file data
      const buffer = Buffer.from(fileData, 'base64');

      // Create the full file path
      const fullPath = path.join(this.storagePath, filePath);

      // Ensure the directory exists
      const directory = path.dirname(fullPath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      // Write the file
      fs.writeFileSync(fullPath, buffer);

      // Return the result with URL for frontend access
      const url = this.getFileUrl(filePath);

      return {
        url,
        filePath,
      };
    } catch (error) {
      throw new Error(`Failed to save file locally: ${error.message}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.storagePath, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      throw new Error(`Failed to delete local file: ${error.message}`);
    }
  }

  getFileUrl(filePath: string): string {
    // Return URL that can be accessed by the frontend
    return `${this.baseUrl}/api/files/${filePath}`;
  }
}
