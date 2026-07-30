'use client';

import {
  Eye,
  Mail,
  MousePointerClick,
  Users,
  AlertTriangle,
} from 'lucide-react';

import type { MarketingCampaign } from '../lib/marketing-types';
import StatCard from './StatCard';

type Props = {
  campaign: MarketingCampaign;
};

export default function CampaignStats({
  campaign,
}: Props) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label="Recipients"
        value={campaign.totalRecipients}
        icon={Users}
      />

      <StatCard
        label="Sent"
        value={campaign.sentCount}
        icon={Mail}
      />

      <StatCard
        label="Opened"
        value={campaign.openedCount}
        icon={Eye}
      />

      <StatCard
        label="Clicked"
        value={campaign.clickedCount}
        icon={MousePointerClick}
      />

      <StatCard
        label="Failed"
        value={campaign.failedCount}
        icon={AlertTriangle}
      />
    </section>
  );
}