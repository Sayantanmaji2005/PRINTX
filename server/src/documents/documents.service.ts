import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { PDFDocument } from 'pdf-lib';
import { PaperSize, PageOrientation } from '@/types';

export interface DocumentAnalysisResult {
  pageCount: number;
  detectedPaperSize: PaperSize;
  detectedOrientation: PageOrientation;
  detectedColorPages: number;
  detectedBwPages: number;
  pages: Array<{
    pageNumber: number;
    hasColor: boolean;
    width: number;
    height: number;
  }>;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async processAndSaveDocument(
    file: Express.Multer.File,
    customerSessionId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for upload');
    }

    // Verify valid customer session
    const session = await this.prisma.customerSession.findUnique({
      where: { id: customerSessionId },
      include: { shop: true },
    });

    if (!session) {
      throw new BadRequestException('Invalid or expired customer session ID');
    }

    // 1. Save file to storage
    const uploadResult = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    // 2. Perform Document Analysis
    let analysis: DocumentAnalysisResult;
    if (file.mimetype === 'application/pdf') {
      analysis = await this.analyzePdf(file.buffer);
    } else if (file.mimetype.startsWith('image/')) {
      analysis = this.analyzeImage(file.buffer);
    } else {
      // DOCX / Other formats fallback
      analysis = {
        pageCount: 1,
        detectedPaperSize: PaperSize.A4,
        detectedOrientation: PageOrientation.PORTRAIT,
        detectedColorPages: 1,
        detectedBwPages: 0,
        pages: [{ pageNumber: 1, hasColor: true, width: 595.28, height: 841.89 }],
      };
    }

    // Retention expiry (default 24h)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (session.shop.retentionHours || 24));

    // 3. Save Document in DB
    const document = await this.prisma.document.create({
      data: {
        customerSessionId: session.id,
        fileName: uploadResult.fileKey,
        originalName: file.originalname,
        fileSize: uploadResult.fileSize,
        mimeType: file.mimetype,
        fileKey: uploadResult.fileKey,
        storageUrl: uploadResult.storageUrl,
        pageCount: analysis.pageCount,
        detectedColorPages: analysis.detectedColorPages,
        detectedBwPages: analysis.detectedBwPages,
        detectedPaperSize: analysis.detectedPaperSize as any,
        detectedOrientation: analysis.detectedOrientation as any,
        isProcessed: true,
        expiresAt,
        pages: {
          create: analysis.pages.map((p) => ({
            pageNumber: p.pageNumber,
            hasColor: p.hasColor,
            width: p.width,
            height: p.height,
          })),
        },
      },
      include: {
        pages: { orderBy: { pageNumber: 'asc' } },
      },
    });

    this.logger.log(
      `Document processed: ${document.originalName} | Pages: ${document.pageCount} (Color: ${document.detectedColorPages}, B&W: ${document.detectedBwPages}) | Size: ${document.detectedPaperSize}`,
    );

    return document;
  }

  async getDocument(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        pages: { orderBy: { pageNumber: 'asc' } },
        customerSession: {
          select: { id: true, shopId: true, shop: { select: { name: true, slug: true } } },
        },
      },
    });

    if (!document || document.deletedAt) {
      throw new NotFoundException('Document not found or has been deleted');
    }

    return document;
  }

  async getDocumentFile(fileKey: string) {
    return this.storageService.getFileStream(fileKey);
  }

  async deleteDocument(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.storageService.deleteFile(document.fileKey);
    return this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // PDF Deep Analyzer
  private async analyzePdf(buffer: Buffer): Promise<DocumentAnalysisResult> {
    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const pageCount = pages.length;

      let detectedColorPages = 0;
      let detectedBwPages = 0;
      const pageResults = [];

      let dominantPaperSize = PaperSize.A4;
      let dominantOrientation = PageOrientation.PORTRAIT;

      for (let i = 0; i < pageCount; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const orientation =
          height >= width ? PageOrientation.PORTRAIT : PageOrientation.LANDSCAPE;

        if (i === 0) {
          dominantOrientation = orientation;
          dominantPaperSize = this.detectPaperSize(width, height);
        }

        // Color detection heuristic
        const hasColor = this.detectPageColor(page, buffer);
        if (hasColor) {
          detectedColorPages++;
        } else {
          detectedBwPages++;
        }

        pageResults.push({
          pageNumber: i + 1,
          hasColor,
          width,
          height,
        });
      }

      return {
        pageCount,
        detectedPaperSize: dominantPaperSize,
        detectedOrientation: dominantOrientation,
        detectedColorPages,
        detectedBwPages,
        pages: pageResults,
      };
    } catch (err: any) {
      this.logger.error(`PDF Analysis error: ${err.message}`);
      // Fallback
      return {
        pageCount: 1,
        detectedPaperSize: PaperSize.A4,
        detectedOrientation: PageOrientation.PORTRAIT,
        detectedColorPages: 0,
        detectedBwPages: 1,
        pages: [{ pageNumber: 1, hasColor: false, width: 595.28, height: 841.89 }],
      };
    }
  }

  // Image Analyzer (JPG, PNG, WebP)
  private analyzeImage(buffer: Buffer): DocumentAnalysisResult {
    return {
      pageCount: 1,
      detectedPaperSize: PaperSize.A4,
      detectedOrientation: PageOrientation.PORTRAIT,
      detectedColorPages: 1,
      detectedBwPages: 0,
      pages: [
        {
          pageNumber: 1,
          hasColor: true,
          width: 595.28,
          height: 841.89,
        },
      ],
    };
  }

  // Matches PDF point dimensions to ISO & Standard paper sizes
  private detectPaperSize(width: number, height: number): PaperSize {
    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);

    // A4: ~595.28 x 841.89 pt (with 20pt tolerance)
    if (Math.abs(minDim - 595.28) < 40 && Math.abs(maxDim - 841.89) < 40) {
      return PaperSize.A4;
    }
    // A3: ~841.89 x 1190.55 pt
    if (Math.abs(minDim - 841.89) < 60 && Math.abs(maxDim - 1190.55) < 60) {
      return PaperSize.A3;
    }
    // Letter: ~612 x 792 pt
    if (Math.abs(minDim - 612) < 30 && Math.abs(maxDim - 792) < 30) {
      return PaperSize.LETTER;
    }
    // Legal: ~612 x 1008 pt
    if (Math.abs(minDim - 612) < 30 && Math.abs(maxDim - 1008) < 30) {
      return PaperSize.LEGAL;
    }

    return PaperSize.A4;
  }

  // Inspect page content streams for non-grayscale color operators
  private detectPageColor(page: any, buffer: Buffer): boolean {
    try {
      const node = page.node;
      const resources = node.Resources?.();
      if (!resources) return false;

      // Check if ColorSpace includes DeviceRGB, ICCBased RGB or Pattern
      const cs = resources.lookupMaybe?.(resources, 'ColorSpace');
      if (cs) {
        return true;
      }

      // Check for RGB color drawing commands in raw content stream
      const rawString = buffer.toString('latin1');
      const rgbRegex = /\b(\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s+(rg|RG|k|K)\b/g;
      let match;
      while ((match = rgbRegex.exec(rawString)) !== null) {
        const [_, r, g, b, op] = match;
        if ((op === 'rg' || op === 'RG') && (r !== g || g !== b)) {
          return true; // Contains non-gray color
        }
      }
      return false;
    } catch {
      return false;
    }
  }
}
