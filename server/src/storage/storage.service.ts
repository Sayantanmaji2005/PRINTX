import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadResult {
  fileKey: string;
  storageUrl?: string;
  fileSize: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir: string;
  private readonly provider: string;

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get<string>('STORAGE_PROVIDER', 'local');
    this.uploadDir = path.resolve(
      process.cwd(),
      this.configService.get<string>('LOCAL_STORAGE_DIR', './uploads'),
      'documents',
    );

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<UploadResult> {
    const timestamp = Date.now();
    const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `${timestamp}-${Math.random().toString(36).substring(2, 8)}-${cleanName}`;
    const filePath = path.join(this.uploadDir, fileKey);

    await fs.promises.writeFile(filePath, fileBuffer);
    this.logger.log(`Saved file locally: ${fileKey} (${fileBuffer.length} bytes)`);

    return {
      fileKey,
      fileSize: fileBuffer.length,
      storageUrl: `/api/documents/file/${fileKey}`,
    };
  }

  getFilePath(fileKey: string): string {
    const safeKey = path.basename(fileKey);
    const filePath = path.join(this.uploadDir, safeKey);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File with key '${fileKey}' not found in storage`);
    }
    return filePath;
  }

  async getFileStream(fileKey: string): Promise<fs.ReadStream> {
    const filePath = this.getFilePath(fileKey);
    return fs.createReadStream(filePath);
  }

  async getFileBuffer(fileKey: string): Promise<Buffer> {
    const filePath = this.getFilePath(fileKey);
    return fs.promises.readFile(filePath);
  }

  async deleteFile(fileKey: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(fileKey);
      await fs.promises.unlink(filePath);
      this.logger.log(`Deleted file: ${fileKey}`);
      return true;
    } catch (err: any) {
      this.logger.warn(`Could not delete file ${fileKey}: ${err.message}`);
      return false;
    }
  }
}
