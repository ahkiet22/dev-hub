export type ProjectStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface Project {
  id: string;
  userId: string;
  code: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithSummary extends Project {
  backendCount: number;
  frontendCount: number;
  healthyBackends: number;
  degradedBackends: number;
  unhealthyBackends: number;
}
