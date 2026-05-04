type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

function getSupabaseUrl() {
  const url = process.env.SUPABASE_URL?.trim();
  if (!url) {
    throw new Error('SUPABASE_URL is missing.');
  }
  return url.replace(/\/$/, '');
}

function getAnonKey() {
  const key = process.env.SUPABASE_ANON_KEY?.trim();
  if (!key) {
    throw new Error('SUPABASE_ANON_KEY is missing.');
  }
  return key;
}

function getServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing.');
  }
  return key;
}

async function parseError(response: Response) {
  const text = await response.text();
  try {
    const json = JSON.parse(text) as { msg?: string; message?: string; error_description?: string; error?: string };
    return json.msg || json.message || json.error_description || json.error || text;
  } catch {
    return text;
  }
}

export async function signInWithPassword(email: string, password: string) {
  const response = await fetch(`${getSupabaseUrl()}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: getAnonKey(),
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: SupabaseAuthUser;
  };
}

export async function getUserFromAccessToken(accessToken: string) {
  const response = await fetch(`${getSupabaseUrl()}/auth/v1/user`, {
    headers: {
      apikey: getAnonKey(),
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as SupabaseAuthUser;
}

export async function createSupabaseUser(params: {
  email: string;
  password: string;
  fullName: string;
}) {
  const response = await fetch(`${getSupabaseUrl()}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: getServiceRoleKey(),
      authorization: `Bearer ${getServiceRoleKey()}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        full_name: params.fullName,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as SupabaseAuthUser;
}
