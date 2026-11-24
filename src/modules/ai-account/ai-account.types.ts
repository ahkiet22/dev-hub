export interface AiAccount {
  id: string;
  userId: string;
  providerId: string;
  providerCode: string;
  providerName: string;
  providerWebsiteUrl: string;
  providerLogoUrl: string | null;
  email: string;
  note: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
