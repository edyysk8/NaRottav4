import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const IS_PROD = process.env.NODE_ENV === 'production';

export async function getSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('narotta_admin_access_token')?.value;
  const refreshToken = cookieStore.get('narotta_admin_refresh_token')?.value;
  return { accessToken, refreshToken };
}

export async function setTokens(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  const options = { httpOnly: true, secure: IS_PROD, sameSite: 'lax' as const, path: '/' };
  cookieStore.set('narotta_admin_access_token', accessToken, options);
  cookieStore.set('narotta_admin_refresh_token', refreshToken, options);
}

export async function clearTokens() {
  const cookieStore = await cookies();
  cookieStore.delete('narotta_admin_access_token');
  cookieStore.delete('narotta_admin_refresh_token');
}

export async function apiFetch(path: string, init: RequestInit = {}, retry = true) {
  const { accessToken, refreshToken } = await getSession();
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);

  let response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (response.status !== 401 || !refreshToken || !retry) return response;

  const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store'
  });

  if (!refreshResponse.ok) return response;

  const refreshData = await refreshResponse.json();
  await setTokens(refreshData.accessToken, refreshData.refreshToken);
  return apiFetch(path, init, false);
}

export async function requireAdmin() {
  const response = await apiFetch('/auth/me');
  if (!response.ok) redirect('/login');
  const data = await response.json();
  if (data.user?.role !== 'admin') redirect('/login');
  return data.user;
}
