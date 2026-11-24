export interface AiProvider {
  id: string;
  code: string;
  name: string;
  websiteUrl: string;
  logoUrl: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
