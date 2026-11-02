import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
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
        const mime = (file.mimetype || '').toLowerCase();
        const ext = (file.originalname || '').split('.').pop()?.toLowerCase() || '';

        const isPdf = mime.includes('pdf') || ext === 'pdf';
        const isImage =
          mime.startsWith('image/') ||
          ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'bmp', 'tiff', 'gif'].includes(ext);
        const isDoc =
          mime.includes('word') ||
          mime.includes('officedocument') ||
          mime.includes('document') ||
          ['docx', 'doc', 'txt', 'rtf'].includes(ext);

        if (!isPdf && !isImage && !isDoc) {
          return callback(
            new BadRequestException(
              `Unsupported file format: ${file.mimetype || ext}. Please upload PDF, Word document, or Photos (JPG, PNG, WEBP).`,
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
    @Body('customerSessionId') bodySessionId: string,
    @Query('customerSessionId') querySessionId: string,
  ) {
    const customerSessionId = bodySessionId || querySessionId;
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
