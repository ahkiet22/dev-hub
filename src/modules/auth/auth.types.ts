export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRecord extends AuthUser {
  passwordHash: string;
}

export interface UserSession {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface AuthenticatedSession {
  session: UserSession;
  user: AuthUser;
}
