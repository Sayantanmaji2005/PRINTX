import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PDFDocument } from 'pdf-lib';

describe('PrintX Platform API (Phase 1 & Phase 2 e2e)', () => {
  let app: INestApplication;
  let ownerToken = '';
  let adminToken = '';
  let testShopId = '';
  let customerSessionId = '';
  let uploadedDocId = '';
  let samplePdfBuffer: Buffer;

  beforeAll(async () => {
    // Generate a test 3-page PDF in memory
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([595.28, 841.89]); // Page 1: A4
    pdfDoc.addPage([595.28, 841.89]); // Page 2: A4
    pdfDoc.addPage([595.28, 841.89]); // Page 3: A4
    const pdfBytes = await pdfDoc.save();
    samplePdfBuffer = Buffer.from(pdfBytes);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Health Check Endpoint', () => {
    it('GET /api/health should return UP status and database connected', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('UP');
      expect(response.body.data.services.database).toBe('connected');
    });
  });

  describe('2. Authentication Module', () => {
    it('POST /api/auth/login should authenticate shop owner', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'maji@printx.io',
          password: 'Password@123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.role).toBe('SHOP_OWNER');

      ownerToken = response.body.data.accessToken;
      testShopId = response.body.data.user.shopId;
    });

    it('POST /api/auth/login should authenticate super admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@printx.io',
          password: 'Password@123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('SUPER_ADMIN');
      adminToken = response.body.data.accessToken;
    });
  });

  describe('3. Customer Session & Shop QR', () => {
    it('POST /api/customer-sessions/start should create guest session for shop QR scan', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/customer-sessions/start')
        .send({
          shopSlug: 'maji-xerox-station',
          customerPhone: '+919999888877',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      customerSessionId = response.body.data.id;
    });
  });

  describe('4. Document Upload & PDF Analysis (Phase 2)', () => {
    it('POST /api/documents/upload should upload, parse PDF, and auto-detect 3 pages', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/documents/upload')
        .field('customerSessionId', customerSessionId)
        .attach('file', samplePdfBuffer, 'sample-assignment.pdf')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.pageCount).toBe(3);
      expect(response.body.data.detectedPaperSize).toBe('A4');
      expect(response.body.data.pages.length).toBe(3);

      uploadedDocId = response.body.data.id;
    });

    it('GET /api/documents/:id should return document metadata and page breakdown', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/documents/${uploadedDocId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.originalName).toBe('sample-assignment.pdf');
      expect(response.body.data.pageCount).toBe(3);
    });
  });

  describe('5. Super Admin Platform Master APIs (Phase 2)', () => {
    it('GET /api/admin/overview should return multi-shop telemetry and platform stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics).toBeDefined();
      expect(response.body.data.metrics.totalShops).toBeGreaterThanOrEqual(1);
      expect(response.body.data.metrics.totalCustomerSessions).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(response.body.data.recentShops)).toBe(true);
    });

    it('GET /api/admin/overview should block unauthorized regular users', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${ownerToken}`) // Role is SHOP_OWNER, requires SUPER_ADMIN
        .expect(403);
    });
  });
});
