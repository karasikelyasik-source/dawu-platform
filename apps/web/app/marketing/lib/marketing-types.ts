export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'QUEUED'
  | 'SENDING'
  | 'SENT'
  | 'FAILED'
  | 'CANCELLED';

export type AudienceType =
  | 'ALL_CUSTOMERS'
  | 'ACTIVE_CUSTOMERS'
  | 'INACTIVE_CUSTOMERS'
  | 'MANUAL';

export type RecipientStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'OPENED'
  | 'CLICKED'
  | 'FAILED'
  | 'SKIPPED';

export type PromoCode = {
  id: string;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  isActive: boolean;
  expiresAt?: string | null;
};

export type MarketingRecipient = {
  id: string;
  customerId?: string | null;
  name?: string | null;
  email: string;
  status: RecipientStatus;
  attempts: number;
  errorMessage?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  openedAt?: string | null;
  clickedAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MarketingCampaign = {
  id: string;
  name: string;
  subject: string;
  previewText?: string | null;

  title?: string | null;
  subtitle?: string | null;
  body: string;

  buttonText?: string | null;
  buttonUrl?: string | null;
  imageUrl?: string | null;

  audienceType?: AudienceType | null;
  promoCodeId?: string | null;
  promoCode?: PromoCode | null;

  senderName?: string | null;
  senderEmail?: string | null;

  status: CampaignStatus;

  totalRecipients: number;
  queuedCount: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  failedCount: number;
  skippedCount: number;

  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;

  createdAt: string;
  updatedAt: string;

  recipients?: MarketingRecipient[];

  _count?: {
    recipients: number;
  };
};

export type MarketingDashboard = {
  totalCustomers: number;
  totalCampaigns: number;
  activePromoCodes: number;
  totalRecipients: number;
  emailsSent: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  failedCount: number;
  openRate: number;
  clickRate: number;
  recentCampaigns: MarketingCampaign[];
};

export type CampaignFormValues = {
  name: string;
  subject: string;
  previewText: string;
  title: string;
  subtitle: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  imageUrl: string;
  audienceType: AudienceType;
  promoCodeId: string;
  senderName: string;
  senderEmail: string;
  scheduledAt: string;
};

export type CreateCampaignPayload = {
  name: string;
  subject: string;
  previewText?: string;
  title?: string;
  subtitle?: string;
  body: string;
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
  audienceType?: AudienceType;
  promoCodeId?: string;
  senderName?: string;
  senderEmail?: string;
  scheduledAt?: string;
};

export type SendCampaignResult = {
  success: boolean;
  sentCount: number;
  failedCount: number;
  campaign: MarketingCampaign;
};
export type SendCampaignToContactPayload = {
  email: string;
  name?: string;
};

export type SendCampaignToContactResult = {
  success: boolean;
  queued: boolean;
  jobId: string;
  email: string;
  message: string;
};