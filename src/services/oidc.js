/**
 * Cryptographic & OIDC Helper Service
 * Implements RFC 7636 PKCE S256 code challenge generation,
 * Keycloak authorization URL builder, token exchange and refresh.
 */

/**
 * Generate cryptographically secure random string
 */
export function generateRandomString(length = 43) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map((x) => charset[x % charset.length])
    .join('');
}

/**
 * SHA-256 hash using Web Cryptography API
 */
async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

/**
 * Convert buffer to base64url format according to RFC 7636
 */
function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate PKCE code verifier and code challenge (S256)
 */
export async function generatePkce() {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(hashed);
  return { codeVerifier, codeChallenge };
}

/**
 * Decode JWT without verifying signature (standard browser-side inspection)
 */
export function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64UrlDecode = (str) => {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    };

    const header = base64UrlDecode(parts[0]);
    const payload = base64UrlDecode(parts[1]);
    const signature = parts[2];

    return {
      raw: token,
      header,
      payload,
      signature,
    };
  } catch (err) {
    console.error('Failed to parse JWT token', err);
    return null;
  }
}

/**
 * Build Keycloak OIDC Authorization URL with PKCE and specific factor level (SFA vs PFA)
 */
export function buildAuthorizeUrl(config, params = {}) {
  const cleanBase = config.baseUrl.replace(/\/+$/, '');
  const endpoint = `${cleanBase}/realms/${encodeURIComponent(config.realm)}/protocol/openid-connect/auth`;

  const searchParams = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope || 'openid',
    code_challenge: params.codeChallenge,
    code_challenge_method: 'S256',
    state: params.state,
    nonce: params.nonce,
  });

  if (params.acrValue) {
    searchParams.set('acr_values', params.acrValue);
  }

  if (params.prompt) {
    searchParams.set('prompt', params.prompt);
  }

  if (params.kcAction) {
    searchParams.set('kc_action', params.kcAction);
  }

  if (params.loginHint) {
    searchParams.set('login_hint', params.loginHint);
  }

  return `${endpoint}?${searchParams.toString()}`;
}

/**
 * Exchange Authorization Code for Tokens at Keycloak Token Endpoint
 */
export async function exchangeCodeForTokens(config, code, codeVerifier) {
  const cleanBase = config.baseUrl.replace(/\/+$/, '');
  const endpoint = `${cleanBase}/realms/${encodeURIComponent(config.realm)}/protocol/openid-connect/token`;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    code: code,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    let errorDetails = '';
    try {
      const errJson = await response.json();
      errorDetails = errJson.error_description || errJson.error || JSON.stringify(errJson);
    } catch {
      errorDetails = await response.text();
    }
    throw new Error(`Token exchange failed (${response.status}): ${errorDetails}`);
  }

  return response.json();
}

/**
 * Refresh tokens using refresh_token grant
 */
export async function refreshTokens(config, refreshToken) {
  const cleanBase = config.baseUrl.replace(/\/+$/, '');
  const endpoint = `${cleanBase}/realms/${encodeURIComponent(config.realm)}/protocol/openid-connect/token`;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.clientId,
    refresh_token: refreshToken,
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    let errorDetails = '';
    try {
      const errJson = await response.json();
      errorDetails = errJson.error_description || errJson.error || JSON.stringify(errJson);
    } catch {
      errorDetails = await response.text();
    }
    throw new Error(`Token refresh failed (${response.status}): ${errorDetails}`);
  }

  return response.json();
}

/**
 * Direct Access Grants (ROPC)
 */
export async function directGrantLogin(config, username, password, totp = null) {
  const cleanBase = config.baseUrl.replace(/\/+$/, '');
  const endpoint = `${cleanBase}/realms/${encodeURIComponent(config.realm)}/protocol/openid-connect/token`;

  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: config.clientId,
    username,
    password,
    scope: config.scope || 'openid',
  });

  if (totp) {
    body.set('totp', totp);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    let errorDetails = '';
    try {
      const errJson = await response.json();
      errorDetails = errJson.error_description || errJson.error || JSON.stringify(errJson);
    } catch {
      errorDetails = await response.text();
    }
    throw new Error(`Direct Grant failed (${response.status}): ${errorDetails}`);
  }

  return response.json();
}

/**
 * Test connectivity to Keycloak OpenID configuration
 */
export async function testKeycloakConnectivity(baseUrl, realm) {
  try {
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const url = `${cleanBase}/realms/${encodeURIComponent(realm)}/.well-known/openid-configuration`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { success: true, data };
    } else {
      return {
        success: false,
        error: `HTTP ${res.status}: ${res.statusText}. Make sure realm "${realm}" exists in Keycloak.`,
      };
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('abort') || errorMsg.includes('Failed to fetch')) {
      return {
        success: false,
        error: `Could not reach ${baseUrl}. Verify Keycloak is running on this port and Web Origins is set to '*' in Keycloak client for CORS.`,
      };
    }
    return { success: false, error: errorMsg };
  }
}

/**
 * Build Keycloak logout URL
 */
export function buildLogoutUrl(config, idToken = null) {
  const cleanBase = config.baseUrl.replace(/\/+$/, '');
  const endpoint = `${cleanBase}/realms/${encodeURIComponent(config.realm)}/protocol/openid-connect/logout`;

  const params = new URLSearchParams({
    client_id: config.clientId,
    post_logout_redirect_uri: window.location.origin,
  });

  if (idToken) {
    params.set('id_token_hint', idToken);
  }

  return `${endpoint}?${params.toString()}`;
}
