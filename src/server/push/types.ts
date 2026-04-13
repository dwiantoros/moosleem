export interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushSubscriber {
  endpoint: string;
  subscription: PushSubscriptionPayload;
  latitude: number;
  longitude: number;
  timezone: string;
  method: number;
  createdAt: number;
  updatedAt: number;
  lastSentTags: string[];
}

export interface PushPayload {
  title: string;
  body: string;
  tag: string;
  url?: string;
  requireInteraction?: boolean;
  icon?: string;
  badge?: string;
  image?: string;
  actions?: Array<{ action: string; title: string }>;
}
