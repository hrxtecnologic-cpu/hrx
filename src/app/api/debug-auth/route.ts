import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  // 🔒 SECURITY: Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { userId, sessionClaims } = await auth();
  const user = await currentUser();

  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);

  const userEmail = (sessionClaims?.email as string)?.toLowerCase() || '';

  return NextResponse.json({
    userId,
    userEmail,
    clerkEmailRaw: sessionClaims?.email,
    primaryEmail: user?.emailAddresses[0]?.emailAddress,
    adminEmailsConfigured: ADMIN_EMAILS,
    isInAdminList: ADMIN_EMAILS.includes(userEmail),
    publicMetadata: sessionClaims?.publicMetadata,
    role: sessionClaims?.publicMetadata?.role,
    isAdmin: ADMIN_EMAILS.includes(userEmail) || sessionClaims?.publicMetadata?.role === 'admin',
  });
}
