import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const role = cookieStore.get('spiceindia_auth')?.value;

  if (role) {
    return NextResponse.json({ role });
  }

  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}
