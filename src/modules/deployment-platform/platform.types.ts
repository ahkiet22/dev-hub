export interface DeploymentPlatform {
  id: string;
  code: string;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  consoleUrl: string | null;
  iconUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
