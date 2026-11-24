export type FrontendIntegrationType = 'MODULE_FEDERATION' | 'IFRAME' | 'EXTERNAL';

export interface ProjectFrontend {
  id: string;
  projectId: string;
  projectName?: string;
  deploymentPlatformId: string | null;
  platformName?: string | null;
  name: string;
  slug: string;
  description: string | null;
  repositoryUrl: string | null;
  applicationUrl: string | null;
  deploymentConsoleUrl: string | null;
  integrationType: FrontendIntegrationType;
  entryUrl: string | null;
  remoteName: string | null;
  exposedModule: string | null;
  iconUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
