/**
 * Pre-configured Keycloak Realm JSON export for instant 1-click import.
 * Contains:
 * - 2 Clients: "callrecording" and "faxmail" (plus "react-app" legacy alias)
 * - 3 Roles per client: "user", "tenant", "admin"
 * - 18 Testing Users (2 apps x 3 roles x 3 factor instances = 18 users) with suffixes .sfa, .totp, .fido2 and default password "password123"
 * - High Assurance PFA demo accounts: "sam.webauthn" (WebAuthn / Passkey) and "morgan.pfa" (TOTP Step-Up)
 */

export const AVAILABLE_CLIENTS = [
  { id: 'callrecording', name: 'Call Recording', description: 'Call Recording application client' },
  { id: 'faxmail', name: 'Fax Mail', description: 'Fax Mail application client' },
];

export const AVAILABLE_ROLES = [
  { id: 'user', name: 'User', description: 'Standard end-user access' },
  { id: 'tenant', name: 'Tenant', description: 'Tenant-level administrative access' },
  { id: 'admin', name: 'Admin', description: 'Full system administrator privileges' },
];

// Helper to generate the 18 testing users with distinct identification types
const generateTestingUsers = () => {
  const users = [];
  const clients = ['callrecording', 'faxmail'];
  const roles = ['user', 'tenant', 'admin'];
  const factors = [
    { suffix: 'sfa', authLabel: 'Password (SFA)', factorLevel: 'sfa', identificationType: 'password', requiredActions: [] },
    { suffix: 'totp', authLabel: 'TOTP MFA (PFA)', factorLevel: 'pfa-totp', identificationType: 'totp', requiredActions: ['CONFIGURE_TOTP'] },
    { suffix: 'fido2', authLabel: 'Passkey WebAuthn (PFA)', factorLevel: 'pfa-webauthn', identificationType: 'webauthn', requiredActions: ['webauthn-register'] },
  ];

  clients.forEach((client) => {
    roles.forEach((role) => {
      factors.forEach(({ suffix, authLabel, factorLevel, identificationType, requiredActions }) => {
        const username = `${client}.${role}.${suffix}`;
        const appLabel = client === 'callrecording' ? 'Call Recording' : 'Fax Mail';
        const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

        users.push({
          username,
          enabled: true,
          email: `${username}@hcltech.com`,
          firstName: `${appLabel} ${roleLabel} (${authLabel})`,
          lastName: suffix.toUpperCase(),
          emailVerified: true,
          credentials: [
            {
              type: 'password',
              value: 'password123',
              temporary: false,
            },
          ],
          requiredActions,
          realmRoles: [role],
          clientRoles: {
            [client]: [role],
          },
          attributes: {
            clientApp: [client],
            appRole: [role],
            factorLevel: [factorLevel],
            identificationType: [identificationType],
            authTypeDescription: [authLabel],
            userInstance: [suffix],
          },
        });
      });
    });
  });

  return users;
};

export const TESTING_USERS_MATRIX = generateTestingUsers();

const buildClientDefinition = (clientId, name, description) => ({
  clientId,
  name,
  description,
  enabled: true,
  publicClient: true,
  protocol: 'openid-connect',
  directAccessGrantsEnabled: true,
  standardFlowEnabled: true,
  implicitFlowEnabled: false,
  serviceAccountsEnabled: false,
  attributes: {
    'pkce.code.challenge.method': 'S256',
    'post.logout.redirect.uris': '+',
    'access.token.lifespan': '300',
  },
  redirectUris: [
    'http://localhost:3000/*',
    'http://localhost:5173/*',
    'https://ais-dev-sz3fx46ezbpjibfjglorzp-686085722197.europe-west1.run.app/*',
    'https://ais-pre-sz3fx46ezbpjibfjglorzp-686085722197.europe-west1.run.app/*',
    '*',
  ],
  webOrigins: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://ais-dev-sz3fx46ezbpjibfjglorzp-686085722197.europe-west1.run.app',
    'https://ais-pre-sz3fx46ezbpjibfjglorzp-686085722197.europe-west1.run.app',
    '*',
  ],
  defaultClientScopes: [
    'web-origins',
    'acr',
    'roles',
    'profile',
    'email',
  ],
  optionalClientScopes: [
    'address',
    'phone',
    'offline_access',
    'microprofile-jwt',
  ],
});

export const KEYCLOAK_DEMO_REALM = {
  id: 'sfa-pfa-demo',
  realm: 'sfa-pfa-demo',
  displayName: 'SFA & PFA Demo Realm',
  enabled: true,
  sslRequired: 'external',
  registrationAllowed: false,
  loginWithEmailAllowed: true,
  duplicateEmailsAllowed: false,
  resetPasswordAllowed: true,
  editUsernameAllowed: false,
  bruteForceProtected: true,
  permanentLockout: false,
  maxFailureWaitSeconds: 900,
  minimumQuickLoginWaitSeconds: 60,
  waitIncrementSeconds: 60,
  quickLoginCheckMilliSeconds: 1000,
  maxDeltaTimeSeconds: 43200,
  failureFactor: 10,
  roles: {
    realm: [
      {
        name: 'user',
        description: 'Standard end-user access',
      },
      {
        name: 'tenant',
        description: 'Tenant-level administrative access',
      },
      {
        name: 'admin',
        description: 'Administrator role with full system management',
      },
      {
        name: 'vault-operator',
        description: 'Operator with elevated PFA privileges',
      },
    ],
    client: {
      callrecording: [
        {
          name: 'user',
          description: 'Call Recording Standard User',
        },
        {
          name: 'tenant',
          description: 'Call Recording Tenant Manager',
        },
        {
          name: 'admin',
          description: 'Call Recording Administrator',
        },
      ],
      faxmail: [
        {
          name: 'user',
          description: 'Fax Mail Standard User',
        },
        {
          name: 'tenant',
          description: 'Fax Mail Tenant Manager',
        },
        {
          name: 'admin',
          description: 'Fax Mail Administrator',
        },
      ],
      'react-app': [
        {
          name: 'user',
          description: 'Standard User',
        },
        {
          name: 'tenant',
          description: 'Tenant User',
        },
        {
          name: 'admin',
          description: 'Administrator',
        },
      ],
    },
  },
  clients: [
    buildClientDefinition(
      'callrecording',
      'Call Recording Client',
      'Call Recording application client with PKCE S256 and Direct Access Grants'
    ),
    buildClientDefinition(
      'faxmail',
      'Fax Mail Client',
      'Fax Mail application client with PKCE S256 and Direct Access Grants'
    ),
    buildClientDefinition(
      'react-app',
      'React SFA & PFA Client',
      'General SPA client with PKCE S256 and Direct Access Grants'
    ),
  ],
  clientScopes: [
    {
      name: 'acr',
      description: 'OpenID Connect acr scope for LoA / factor assurance',
      protocol: 'openid-connect',
      attributes: {
        'include.in.token.scope': 'true',
        'display.on.consent.screen': 'true',
      },
      protocolMappers: [
        {
          name: 'acr',
          protocol: 'openid-connect',
          protocolMapper: 'oidc-acr-mapper',
          consentRequired: false,
          config: {
            'id.token.claim': 'true',
            'access.token.claim': 'true',
            'userinfo.token.claim': 'true',
          },
        },
      ],
    },
  ],
  users: [
    // 18 Structured Test Users (2 clients x 3 roles x 3 users: .sfa, .totp, .fido2)
    ...TESTING_USERS_MATRIX,
  ],
};

export const DOCKER_CLI_COMMAND = `docker run -d --name local-keycloak \\
  -p 8080:8080 \\
  -e KEYCLOAK_ADMIN=admin \\
  -e KEYCLOAK_ADMIN_PASSWORD=admin \\
  quay.io/keycloak/keycloak:26.1.0 \\
  start-dev`;

export const DOCKER_COMPOSE_YML = `services:
  keycloak:
    image: quay.io/keycloak/keycloak:26.1.0
    container_name: local-keycloak
    command: start-dev --import-realm
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - "8080:8080"
    volumes:
      - ./sfa-pfa-demo-realm.json:/opt/keycloak/data/import/realm.json:ro
`;
