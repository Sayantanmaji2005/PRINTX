import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Public()
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB maximum
      },
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
        ];
        if (!allowedMimes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              `Unsupported file type: ${file.mimetype}. Supported: PDF, JPG, PNG, WEBP, DOCX`,
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('customerSessionId') customerSessionId: string,
  ) {
    if (!customerSessionId) {
      throw new BadRequestException('customerSessionId is required');
    }

    const doc = await this.documentsService.processAndSaveDocument(
      file,
      customerSessionId,
    );

    return {
      message: 'Document uploaded and analyzed successfully',
      data: doc,
    };
  }

  @Public()
  @Get(':id')
  async getDocument(@Param('id') id: string) {
    const doc = await this.documentsService.getDocument(id);
    return {
      message: 'Document details retrieved',
      data: doc,
    };
  }

  @Public()
  @Get('file/:fileKey')
  async streamFile(
    @Param('fileKey') fileKey: string,
    @Res() res: Response,
  ) {
    const stream = await this.documentsService.getDocumentFile(fileKey);
    const isPdf = fileKey.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(fileKey);

    const contentType = isPdf
      ? 'application/pdf'
      : isImage
      ? 'image/jpeg'
      : 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileKey}"`);
    stream.pipe(res);
  }

  @Public()
  @Delete(':id')
  async deleteDocument(@Param('id') id: string) {
    await this.documentsService.deleteDocument(id);
    return {
      message: 'Document deleted successfully',
      data: null,
    };
  }
}
