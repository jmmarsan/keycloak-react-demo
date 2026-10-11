import { parseJwt } from './oidc';

/**
 * Creates a base64url encoded string
 */
function base64Url(obj) {
  const json = JSON.stringify(obj);
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generates an authentic mock JWT resembling Keycloak standard tokens
 */
export function generateMockJwt(claims = {}, expiresInSeconds = 300) {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: 'mock-keycloak-key-id-2026',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    exp: now + expiresInSeconds,
    iat: now,
    auth_time: now,
    jti: 'mock-' + Math.random().toString(36).substring(2, 12),
    iss: 'http://localhost:8080/realms/sfa-pfa-demo',
    aud: ['react-app', 'account'],
    typ: 'Bearer',
    azp: 'react-app',
    session_state: 'session-' + Math.random().toString(36).substring(2, 10),
    scope: 'openid profile email',
    ...claims,
  };

  const encodedHeader = base64Url(header);
  const encodedPayload = base64Url(payload);
  const mockSignature = 'mock_signature_' + Math.random().toString(36).substring(2, 16);

  return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
}

/**
 * Mock Users predefined in the Keycloak setup
 */
export const MOCK_USERS = {
  sfa: {
    id: 'usr-sfa-001',
    username: 'alex.sfa',
    name: 'Alex Rivera (SFA Only)',
    email: 'alex.sfa@example.com',
    roles: ['user', 'standard-access'],
  },
  pfaMfa: {
    id: 'usr-pfa-002',
    username: 'morgan.pfa',
    name: 'Morgan Vance (PFA / MFA Step-Up)',
    email: 'morgan.pfa@example.com',
    roles: ['user', 'admin', 'vault-operator'],
  },
  pfaPasswordless: {
    id: 'usr-passless-003',
    username: 'elena.fido',
    name: 'Elena Rostova (PFA / Passkey FIDO2)',
    email: 'elena.fido@example.com',
    roles: ['user', 'security-lead', 'vault-operator'],
  },
};

/**
 * Generate tokens for SFA (Single-Factor Authentication)
 * Single factor: Password only (amr: ["pwd"], acr: "loa-1")
 */
export function mockSfaLogin(username = 'alex.sfa') {
  const user = username?.includes('morgan')
    ? MOCK_USERS.pfaMfa
    : username?.includes('elena')
    ? MOCK_USERS.pfaPasswordless
    : MOCK_USERS.sfa;

  const sub = user.id;
  const commonClaims = {
    sub,
    preferred_username: user.username,
    email: user.email,
    name: user.name,
    email_verified: true,
    acr: 'loa-1',
    amr: ['pwd'], // Single factor: password
    realm_access: { roles: user.roles },
    resource_access: {
      'react-app': { roles: user.roles },
    },
  };

  const accessToken = generateMockJwt(commonClaims, 300);
  const idToken = generateMockJwt(
    {
      ...commonClaims,
      aud: 'react-app',
    },
    300
  );
  const refreshToken = generateMockJwt(
    {
      sub,
      typ: 'Refresh',
      acr: 'loa-1',
    },
    1800
  );

  const tokens = {
    access_token: accessToken,
    id_token: idToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in: 300,
    refresh_expires_in: 1800,
    scope: 'openid profile email',
  };

  const decodedId = parseJwt(idToken);
  const decodedAccess = parseJwt(accessToken);

  const session = {
    isAuthenticated: true,
    factorLevel: 'sfa',
    factorTypeDescription: 'Single-Factor Authentication (Username + Password)',
    user,
    tokens,
    decodedIdToken: decodedId,
    decodedAccessToken: decodedAccess,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 300 * 1000,
    authMode: 'simulator',
    acr: 'loa-1',
    amr: ['pwd'],
  };

  return { tokens, session };
}

/**
 * Generate tokens for PFA (Phishing-Resistant Passwordless / WebAuthn)
 * Factor: FIDO2 / WebAuthn passkey (amr: ["webauthn"], acr: "pfa" or "loa-2")
 */
export function mockPfaPasswordlessLogin() {
  const user = MOCK_USERS.pfaPasswordless;
  const sub = user.id;

  const commonClaims = {
    sub,
    preferred_username: user.username,
    email: user.email,
    name: user.name,
    email_verified: true,
    acr: 'pfa',
    amr: ['webauthn', 'phishing_resistant'], // Phishing-resistant FIDO2 factor
    realm_access: { roles: user.roles },
    resource_access: {
      'react-app': { roles: user.roles },
    },
  };

  const accessToken = generateMockJwt(commonClaims, 300);
  const idToken = generateMockJwt({ ...commonClaims, aud: 'react-app' }, 300);
  const refreshToken = generateMockJwt({ sub, typ: 'Refresh', acr: 'pfa' }, 1800);

  const tokens = {
    access_token: accessToken,
    id_token: idToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in: 300,
    refresh_expires_in: 1800,
    scope: 'openid profile email',
  };

  const decodedId = parseJwt(idToken);
  const decodedAccess = parseJwt(accessToken);

  const session = {
    isAuthenticated: true,
    factorLevel: 'pfa',
    factorTypeDescription: 'Protected Factor Authentication (WebAuthn / Passkey FIDO2)',
    user,
    tokens,
    decodedIdToken: decodedId,
    decodedAccessToken: decodedAccess,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 300 * 1000,
    authMode: 'simulator',
    acr: 'pfa',
    amr: ['webauthn', 'phishing_resistant'],
  };

  return { tokens, session };
}

/**
 * Generate tokens for PFA Multi-Factor / Step-Up (Password + TOTP)
 * Factors: Password + OTP (amr: ["pwd", "otp"], acr: "loa-2")
 */
export function mockPfaMfaLogin() {
  const user = MOCK_USERS.pfaMfa;
  const sub = user.id;

  const commonClaims = {
    sub,
    preferred_username: user.username,
    email: user.email,
    name: user.name,
    email_verified: true,
    acr: 'loa-2',
    amr: ['pwd', 'otp'], // Two factors: password + TOTP
    realm_access: { roles: user.roles },
    resource_access: {
      'react-app': { roles: user.roles },
    },
  };

  const accessToken = generateMockJwt(commonClaims, 300);
  const idToken = generateMockJwt({ ...commonClaims, aud: 'react-app' }, 300);
  const refreshToken = generateMockJwt({ sub, typ: 'Refresh', acr: 'loa-2' }, 1800);

  const tokens = {
    access_token: accessToken,
    id_token: idToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in: 300,
    refresh_expires_in: 1800,
    scope: 'openid profile email',
  };

  const decodedId = parseJwt(idToken);
  const decodedAccess = parseJwt(accessToken);

  const session = {
    isAuthenticated: true,
    factorLevel: 'pfa',
    factorTypeDescription: 'Protected Factor Authentication (Password + TOTP Authenticator)',
    user,
    tokens,
    decodedIdToken: decodedId,
    decodedAccessToken: decodedAccess,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 300 * 1000,
    authMode: 'simulator',
    acr: 'loa-2',
    amr: ['pwd', 'otp'],
  };

  return { tokens, session };
}

/**
 * Step-Up elevation: takes an existing SFA session and upgrades it to PFA
 */
export function elevateSfaToPfa(currentSession, method = 'otp') {
  const updatedAmr = method === 'otp' ? ['pwd', 'otp'] : ['pwd', 'webauthn'];
  const updatedAcr = 'loa-2';

  const commonClaims = {
    sub: currentSession.user.id,
    preferred_username: currentSession.user.username,
    email: currentSession.user.email,
    name: currentSession.user.name,
    email_verified: true,
    acr: updatedAcr,
    amr: updatedAmr,
    realm_access: { roles: [...currentSession.user.roles, 'elevated-operator'] },
    resource_access: {
      'react-app': { roles: [...currentSession.user.roles, 'elevated-operator'] },
    },
  };

  const newAccessToken = generateMockJwt(commonClaims, 300);
  const newIdToken = generateMockJwt({ ...commonClaims, aud: 'react-app' }, 300);
  const newRefreshToken = generateMockJwt(
    { sub: currentSession.user.id, typ: 'Refresh', acr: updatedAcr },
    1800
  );

  const newTokens = {
    access_token: newAccessToken,
    id_token: newIdToken,
    refresh_token: newRefreshToken,
    token_type: 'Bearer',
    expires_in: 300,
    refresh_expires_in: 1800,
    scope: 'openid profile email',
  };

  return {
    ...currentSession,
    factorLevel: 'pfa',
    factorTypeDescription:
      method === 'otp'
        ? 'Stepped-up via TOTP Authenticator (Password + OTP)'
        : 'Stepped-up via WebAuthn Security Key / Passkey',
    user: {
      ...currentSession.user,
      roles: [...currentSession.user.roles, 'elevated-operator'],
    },
    tokens: newTokens,
    decodedIdToken: parseJwt(newIdToken),
    decodedAccessToken: parseJwt(newAccessToken),
    issuedAt: Date.now(),
    expiresAt: Date.now() + 300 * 1000,
    acr: updatedAcr,
    amr: updatedAmr,
  };
}
