import type {
  CreateCampaignPayload,
  MarketingCampaign,
  MarketingDashboard,
  SendCampaignResult,
} from './marketing-types';

const API_BASE = '/api-proxy/marketing';

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as
    | T
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    const apiError = data as ApiErrorResponse | null;

    const message = Array.isArray(apiError?.message)
      ? apiError.message.join(', ')
      : apiError?.message;

    throw new Error(
      message ||
        apiError?.error ||
        `Marketing API returned ${response.status}`,
    );
  }

  return data as T;
}

export async function getMarketingDashboard() {
  const response = await fetch(`${API_BASE}/dashboard`, {
    cache: 'no-store',
  });

  return parseResponse<MarketingDashboard>(response);
}

export async function getCampaigns() {
  const response = await fetch(`${API_BASE}/campaigns`, {
    cache: 'no-store',
  });

  return parseResponse<MarketingCampaign[]>(response);
}

export async function getCampaign(id: string) {
  const response = await fetch(`${API_BASE}/campaigns/${id}`, {
    cache: 'no-store',
  });

  return parseResponse<MarketingCampaign>(response);
}

export async function createCampaign(
  payload: CreateCampaignPayload,
) {
  const response = await fetch(`${API_BASE}/campaigns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<MarketingCampaign>(response);
}

export async function updateCampaign(
  id: string,
  payload: Partial<CreateCampaignPayload>,
) {
  const response = await fetch(`${API_BASE}/campaigns/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<MarketingCampaign>(response);
}

export async function deleteCampaign(id: string) {
  const response = await fetch(`${API_BASE}/campaigns/${id}`, {
    method: 'DELETE',
  });

  return parseResponse<{ success: boolean }>(response);
}

export async function prepareCampaignRecipients(id: string) {
  const response = await fetch(
    `${API_BASE}/campaigns/${id}/prepare`,
    {
      method: 'POST',
    },
  );

  return parseResponse<MarketingCampaign>(response);
}

export async function sendCampaign(id: string) {
  const response = await fetch(`${API_BASE}/campaigns/${id}/send`, {
    method: 'POST',
  });

  return parseResponse<SendCampaignResult>(response);
}