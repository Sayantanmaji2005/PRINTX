export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SHOP_OWNER = 'SHOP_OWNER',
  SHOP_STAFF = 'SHOP_STAFF',
  CUSTOMER = 'CUSTOMER',
}

export enum ShopStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum PaperSize {
  A4 = 'A4',
  A3 = 'A3',
  LETTER = 'LETTER',
  LEGAL = 'LEGAL',
}

export enum ColorMode {
  BW = 'BW',
  COLOR = 'COLOR',
  AUTO = 'AUTO',
}

export enum PrintSide {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
}

export enum PageOrientation {
  AUTO = 'AUTO',
  PORTRAIT = 'PORTRAIT',
  LANDSCAPE = 'LANDSCAPE',
}

export enum PaymentProvider {
  DEMO = 'DEMO',
  RAZORPAY = 'RAZORPAY',
  CASHFREE = 'CASHFREE',
  PHONEPE = 'PHONEPE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}

export enum OrderStatus {
  CREATED = 'CREATED',
  DOCUMENT_PROCESSING = 'DOCUMENT_PROCESSING',
  READY_FOR_PAYMENT = 'READY_FOR_PAYMENT',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  QUEUED = 'QUEUED',
  PRINTING = 'PRINTING',
  PRINTED = 'PRINTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
}

export enum PrintJobStatus {
  WAITING = 'WAITING',
  QUEUED = 'QUEUED',
  ASSIGNED = 'ASSIGNED',
  PRINTING = 'PRINTING',
  PRINTED = 'PRINTED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PrinterStatus {
  READY = 'READY',
  PRINTING = 'PRINTING',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR',
  PAPER_JAM = 'PAPER_JAM',
  OUT_OF_PAPER = 'OUT_OF_PAPER',
  OUT_OF_INK = 'OUT_OF_INK',
}

export enum ScannerStatus {
  CONNECTED = 'CONNECTED',
  READY = 'READY',
  SCANNING = 'SCANNING',
  ERROR = 'ERROR',
  DISCONNECTED = 'DISCONNECTED',
}

export enum AgentStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY',
  ERROR = 'ERROR',
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
  timestamp?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  shopId?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface ShopPublicProfile {
  id: string;
  name: string;
  slug: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  status: ShopStatus;
  logoUrl?: string | null;
  upiId?: string | null;
  hasActivePrinter: boolean;
}

export interface CustomerSessionData {
  id: string;
  shopId: string;
  shopName: string;
  shopSlug: string;
  customerPhone?: string | null;
  createdAt: string;
  expiresAt: string;
}
