export type MarketingCampaignEmailJobData = {
  campaignId: string;
  recipientId: string;
};

export type MarketingContactEmailJobData = {
  campaignId: string;
  email: string;
  name?: string | null;
};

export type MarketingEmailJobData =
  | MarketingCampaignEmailJobData
  | MarketingContactEmailJobData;