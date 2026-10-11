# Keycloak SFA & PFA Authentication Studio

An interactive OpenID Connect (OIDC) testing studio built with React, Material-UI, and PKCE S256. This environment enables comprehensive validation of **Single-Factor Authentication (SFA / LoA 1)**, **Protected-Factor Authentication (PFA / LoA 2)**, and **Multi-Tenant Client Role-Based Access Control (RBAC)** against a local Keycloak Identity Provider (IdP).

---

## 1. Overview & Architecture

The application is configured to test two distinct client applications, multiple role tiers, and a structured matrix of 18 pre-configured test users.

### Dual Client Applications

| Client ID | Display Name | Protocol | Flow Type | PKCE Method |
| :--- | :--- | :--- | :--- | :--- |
| `callrecording` | Call Recording Client | openid-connect | Authorization Code + Direct Access Grants (ROPC) | S256 |
| `faxmail` | Fax Mail Client | openid-connect | Authorization Code + Direct Access Grants (ROPC) | S256 |

Both clients are configured as public clients in Keycloak with wildcard CORS web origins (`*`) and redirect URIs for seamless local development and containerized testing.

### 3 Roles per Client

Each client application defines three role tiers:
1. `user`: Standard end-user with basic resource permissions.
2. `tenant`: Tenant administrator with organizational management rights.
3. `admin`: Full system administrator with elevated privileges.

---

## 2. The 18 Testing Users Matrix

To provide exhaustive test coverage, the realm export generates **18 structured test accounts** (2 Client Apps × 3 Roles × 3 Factor Instances = 18 Users).

- **Default Password for all users**: `password123`
- **Email Domain**: `@hcltech.com`
- **User Naming Pattern**: `<client>.<role>.<factor>`
- **User Factor Mapping**:
  - `.sfa`: Single-Factor Authentication (`SFA` / `LoA 1`) via standard Password (Key icon 🔑).
  - `.totp`: Protected-Factor Authentication (`PFA` / `LoA 2`) via Password + TOTP Authenticator OTP (Shield icon 🛡️).
  - `.fido2`: Protected-Factor Authentication (`PFA` / `LoA 2`) via Passkey / WebAuthn FIDO2 Biometrics / Security Key (Fingerprint icon 🔒).

### Call Recording Client (`callrecording`) — 9 Users

| Username | Role | Factor Identification Type | LoA | Email | Password |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `callrecording.user.sfa` | `user` | Password (SFA) | LoA 1 | `callrecording.user.sfa@hcltech.com` | `password123` |
| `callrecording.user.totp` | `user` | TOTP MFA (PFA) | LoA 2 | `callrecording.user.totp@hcltech.com` | `password123` |
| `callrecording.user.fido2` | `user` | Passkey WebAuthn (PFA) | LoA 2 | `callrecording.user.fido2@hcltech.com` | `password123` |
| `callrecording.tenant.sfa` | `tenant` | Password (SFA) | LoA 1 | `callrecording.tenant.sfa@hcltech.com` | `password123` |
| `callrecording.tenant.totp` | `tenant` | TOTP MFA (PFA) | LoA 2 | `callrecording.tenant.totp@hcltech.com` | `password123` |
| `callrecording.tenant.fido2` | `tenant` | Passkey WebAuthn (PFA) | LoA 2 | `callrecording.tenant.fido2@hcltech.com` | `password123` |
| `callrecording.admin.sfa` | `admin` | Password (SFA) | LoA 1 | `callrecording.admin.sfa@hcltech.com` | `password123` |
| `callrecording.admin.totp` | `admin` | TOTP MFA (PFA) | LoA 2 | `callrecording.admin.totp@hcltech.com` | `password123` |
| `callrecording.admin.fido2` | `admin` | Passkey WebAuthn (PFA) | LoA 2 | `callrecording.admin.fido2@hcltech.com` | `password123` |

### Fax Mail Client (`faxmail`) — 9 Users

| Username | Role | Factor Identification Type | LoA | Email | Password |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `faxmail.user.sfa` | `user` | Password (SFA) | LoA 1 | `faxmail.user.sfa@hcltech.com` | `password123` |
| `faxmail.user.totp` | `user` | TOTP MFA (PFA) | LoA 2 | `faxmail.user.totp@hcltech.com` | `password123` |
| `faxmail.user.fido2` | `user` | Passkey WebAuthn (PFA) | LoA 2 | `faxmail.user.fido2@hcltech.com` | `password123` |
| `faxmail.tenant.sfa` | `tenant` | Password (SFA) | LoA 1 | `faxmail.tenant.sfa@hcltech.com` | `password123` |
| `faxmail.tenant.totp` | `tenant` | TOTP MFA (PFA) | LoA 2 | `faxmail.tenant.totp@hcltech.com` | `password123` |
| `faxmail.tenant.fido2` | `tenant` | Passkey WebAuthn (PFA) | LoA 2 | `faxmail.tenant.fido2@hcltech.com` | `password123` |
| `faxmail.admin.sfa` | `admin` | Password (SFA) | LoA 1 | `faxmail.admin.sfa@hcltech.com` | `password123` |
| `faxmail.admin.totp` | `admin` | TOTP MFA (PFA) | LoA 2 | `faxmail.admin.totp@hcltech.com` | `password123` |
| `faxmail.admin.fido2` | `admin` | Passkey WebAuthn (PFA) | LoA 2 | `faxmail.admin.fido2@hcltech.com` | `password123` |

---

## 3. High Assurance PFA (LoA 2) vs SFA (LoA 1)

Under **NIST SP 800-63B** and **Keycloak Level of Assurance (LoA)** frameworks:
1. **SFA (Single-Factor Authentication / LoA 1)** relies on a single shared secret (username and password) — represented by users ending with `.sfa`.
2. **PFA (Protected-Factor Authentication / LoA 2 / AAL2 & AAL3)** requires elevated or phishing-resistant factors:
   - **Step-Up MFA (Password + TOTP)**: represented by users ending with `.totp` (`amr: ["pwd", "otp"]`).
   - **Passkey / WebAuthn (FIDO2)**: utilizes public-key cryptography bound to the client origin and an authenticator (biometric TouchID / FaceID or hardware security key), satisfying phishing-resistant High Assurance (`amr: ["webauthn"]`) — represented by users ending with `.fido2`.
   - The studio displays a dedicated **Fingerprint Icon** and the label `PFA: Passkey / WebAuthn (LoA 2)` to distinguish it from standard TOTP MFA sessions while granting access to LoA 2 protected resources.

---

## 4. Key Studio Features

### 1. Active Client Switcher
- Located prominently in the top header and in the Auth Flow Console.
- Easily toggle between `callrecording` and `faxmail`.
- Switching clients immediately updates `config.clientId`, adjusts OIDC PKCE redirect flows, and synchronizes the Direct Access Grants token requests.

### 2. Direct Access Grants Tester (ROPC `/token`) with Testing Users Selector
Located in the **Authentication Flows** tab, this tester directly calls Keycloak's token endpoint (`POST /protocol/openid-connect/token`). The active client is managed globally via the app header and target controls (`callrecording` or `faxmail`):
1. **Combo 1 (Client Role)**: `user`, `tenant`, or `admin`
2. **Combo 2 (User Factor Instance)**:
   - `.sfa`: Password (`SFA` • `LoA 1`) with Key icon 🔑
   - `.totp`: PFA Step-Up MFA (`TOTP` • `LoA 2`) with Shield icon 🛡️
   - `.fido2`: PFA Passkey / WebAuthn (`FIDO2` • `LoA 2`) with Fingerprint icon 🔒

**Automatic Pre-filling**:
- Selecting the combos automatically populates the username `<activeClient>.<role>.<factor>`.
- Default password is automatically filled with `password123`.
- Active authentication factor level (`SFA` vs `PFA` vs `WebAuthn`) is immediately assigned.
- When switching clients in the header or target control, the username automatically updates with the active client.

### 3. Live OIDC PKCE Flow (RFC 7636)
- Generates cryptographically secure 64-byte `code_verifier` and SHA-256 Base64URL `code_challenge`.
- Opens a popup window targeting Keycloak's `/auth` endpoint with parameters `client_id`, `response_type=code`, `code_challenge`, and `code_challenge_method=S256`.
- Automatically captures the authorization code via `postMessage`, performs token exchange, and decodes the JWTs.

### 4. Token Inspector & Role Verification
- Inspects decoded headers, payloads, and claims of both the **Access Token** and **ID Token**.
- Extracts client roles from `resource_access[clientId].roles` and realm roles from `realm_access.roles`.
- Displays active assurance level (`acr`), authentication methods references (`amr`), token expiration timer, and allows 1-click token refresh.

### 5. Protected Resources Simulator
- Simulates API endpoints enforcing Level of Assurance policies:
  - **Standard Resources** (Accessible by SFA and PFA).
  - **High Assurance Vault / Admin Ops** (Restricted strictly to PFA LoA 2 sessions).
- Includes step-up elevation flow and testing overrides.

---

## 5. Setting Up Keycloak Locally

### Option A: Quick Docker Run
Run the Keycloak 26.1 container in development mode:

```bash
docker run -d --name local-keycloak \
  -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:26.1.0 \
  start-dev
```

### Option B: Docker Compose with Auto-Import
Save the following as `docker-compose.yml` in the same directory as `sfa-pfa-demo-realm.json`:

```yaml
services:
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
```

Run:
```bash
docker compose up -d
```

### Option C: Import via Keycloak Admin Console (1-Click)
1. Open `http://localhost:8080` in your browser.
2. Sign in to the Admin Console using:
   - **Username**: `admin`
   - **Password**: `admin`
3. In the top-left realm dropdown (defaulting to `master`), click **Create Realm**.
4. Click **Browse** and select `sfa-pfa-demo-realm.json` (downloaded from the **Setup Guide** tab in this app).
5. Click **Create**.
6. The realm `sfa-pfa-demo`, both clients (`callrecording` and `faxmail`), the 3 roles per client (`user`, `tenant`, `admin`), and all 18 test users + PFA demo users are instantly imported and active!

---

## 6. Development & Verification

To run this studio locally:

```bash
# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev

# Build production bundle
npm run build
```
