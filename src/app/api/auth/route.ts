import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();

    const adminPin = process.env.ADMIN_PIN || '1234';
    const managerPin = process.env.MANAGER_PIN || '5678';
    const cookPin = process.env.COOK_PIN || '9999';

    let role = '';
    if (pin === adminPin) role = 'admin';
    else if (pin === managerPin) role = 'manager';
    else if (pin === cookPin) role = 'cook';
    else {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set('spiceindia_auth', role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });

    return NextResponse.json({ role });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('spiceindia_auth');
  return NextResponse.json({ message: 'Logged out' });
}
