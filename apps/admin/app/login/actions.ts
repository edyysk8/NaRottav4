'use server';

import { redirect } from 'next/navigation';
import { API_URL, clearTokens, setTokens } from '../../lib/auth';

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store'
  });

  if (!response.ok) redirect('/login?error=1');

  const data = await response.json();
  if (data.user?.role !== 'admin') redirect('/login?error=role');

  await setTokens(data.accessToken, data.refreshToken);
  redirect('/dashboard');
}

export async function logoutAction() {
  await clearTokens();
  redirect('/login');
}
