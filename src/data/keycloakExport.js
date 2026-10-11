/**
 * Pre-configured Keycloak Realm JSON export for instant 1-click import.
 */
export const KEYCLOAK_DEMO_REALM = {
  id: "sfa-pfa-demo",
  realm: "sfa-pfa-demo",
  displayName: "SFA & PFA Demo Realm",
  enabled: true,
  sslRequired: "external",
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
        name: "user",
        description: "Standard user role",
      },
      {
        name: "admin",
        description: "Administrator role",
      },
      {
        name: "vault-operator",
        description: "Operator with elevated PFA privileges",
      },
    ],
  },
  clients: [
    {
      clientId: "react-app",
      name: "React SFA & PFA Client",
      description: "SPA client with PKCE S256, standard authorization code flow",
      enabled: true,
      publicClient: true,
      protocol: "openid-connect",
      directAccessGrantsEnabled: true,
      standardFlowEnabled: true,
      implicitFlowEnabled: false,
      serviceAccountsEnabled: false,
      attributes: {
        "pkce.code.challenge.method": "S256",
        "post.logout.redirect.uris": "+",
        "access.token.lifespan": "300",
      },
      redirectUris: [
        "http://localhost:3000/*",
        "http://localhost:5173/*",
        "https://ais-dev-sz3fx46ezbpjibfjglorzp-686085722197.europe-west1.run.app/*",
        "https://ais-pre-sz3fx46ezbpjibfjglorzp-686085722197.europe-west1.run.app/*",
        "*",
      ],
      webOrigins: [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://ais-dev-sz3fx46ezbpjibfjglorzp-686085722197.europe-west1.run.app",
        "https://ais-pre-sz3fx46ezbpjibfjglorzp-686085722197.europe-west1.run.app",
        "*",
      ],
      defaultClientScopes: [
        "web-origins",
        "acr",
        "roles",
        "profile",
        "email",
      ],
      optionalClientScopes: [
        "address",
        "phone",
        "offline_access",
        "microprofile-jwt",
      ],
    },
  ],
  clientScopes: [
    {
      name: "acr",
      description: "OpenID Connect acr scope for LoA / factor assurance",
      protocol: "openid-connect",
      attributes: {
        "include.in.token.scope": "true",
        "display.on.consent.screen": "true",
      },
      protocolMappers: [
        {
          name: "acr",
          protocol: "openid-connect",
          protocolMapper: "oidc-acr-mapper",
          consentRequired: false,
          config: {
            "id.token.claim": "true",
            "access.token.claim": "true",
            "userinfo.token.claim": "true",
          },
        },
      ],
    },
  ],
  users: [
    {
      username: "alex.sfa",
      enabled: true,
      email: "alex.sfa@example.com",
      firstName: "Alex",
      lastName: "Rivera",
      emailVerified: true,
      credentials: [
        {
          type: "password",
          value: "password123",
          temporary: false,
        },
      ],
      realmRoles: ["user"],
    },
    {
      username: "morgan.pfa",
      enabled: true,
      email: "morgan.pfa@example.com",
      firstName: "Morgan",
      lastName: "Vance",
      emailVerified: true,
      credentials: [
        {
          type: "password",
          value: "password123",
          temporary: false,
        },
      ],
      requiredActions: ["CONFIGURE_TOTP"],
      realmRoles: ["user", "admin", "vault-operator"],
    },
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
