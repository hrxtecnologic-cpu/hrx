export interface CustomPublicMetadata {
  role?: 'admin' | 'professional' | 'contractor';
  onboardingComplete?: boolean;
}

declare global {
  interface UserPublicMetadata extends CustomPublicMetadata {}
}
