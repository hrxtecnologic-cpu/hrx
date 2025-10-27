export interface CustomPublicMetadata {
  userType?: 'professional' | 'contractor' | 'supplier';
  role?: 'admin' | 'user';
  isAdmin?: boolean;
  onboardingComplete?: boolean;
  onboardingStep?: number;
  professionalRegistered?: boolean;
  supplierRegistered?: boolean;
}

declare global {
  interface UserPublicMetadata extends CustomPublicMetadata {}

  // Custom JWT Session Claims - permite acessar metadata no sessionClaims
  interface CustomJwtSessionClaims {
    metadata?: CustomPublicMetadata;
  }
}

export {};
