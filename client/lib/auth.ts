const ACCESS_TOKEN_KEY = 'workmind_access_token';
const USER_KEY = 'workmind_auth_user';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  credits?: number;
  totalCostUSD?: number;
  allowedModels?: string[];
};

export function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function storeAuthSession(accessToken: string, user: AuthUser) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuthHeaders(headers?: HeadersInit) {
  const token = getStoredAccessToken();
  const merged = new Headers(headers);

  if (token) {
    merged.set('Authorization', `Bearer ${token}`);
  }

  return merged;
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    headers: getAuthHeaders(init.headers),
  });
}
