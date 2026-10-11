import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  Server, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  ExternalLink,
  Code
} from 'lucide-react';
import { KEYCLOAK_DEMO_REALM, DOCKER_CLI_COMMAND, DOCKER_COMPOSE_YML } from '../data/keycloakExport';

export const SetupGuideView = () => {
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const downloadRealmJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(KEYCLOAK_DEMO_REALM, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'sfa-pfa-demo-realm.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Hero / Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Server className="w-3.5 h-3.5" />
              <span>Complete Local Setup Guide</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Configuring Local Keycloak for SFA &amp; PFA
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Follow this step-by-step guide to run Keycloak locally in Docker and configure it to handle both Single-Factor (SFA) and Protected/Step-Up Factor (PFA / MFA / WebAuthn) authentication.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={downloadRealmJson}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Download Realm JSON</span>
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(JSON.stringify(KEYCLOAK_DEMO_REALM, null, 2), 'realm-json')}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-colors"
            >
              {copiedKey === 'realm-json' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Realm JSON</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Method 1: Instant 1-Click Setup with Docker & Realm Import */}
      <section className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Start Keycloak with Docker</h2>
            <p className="text-xs text-slate-400">Run Keycloak 26+ in development mode on port 8080</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Docker CLI option */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>Option A: Docker Run (CLI)</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(DOCKER_CLI_COMMAND, 'docker-cli')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Copy command"
                >
                  {copiedKey === 'docker-cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800/80 leading-relaxed">
                {DOCKER_CLI_COMMAND}
              </pre>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Admin console will be at <code className="text-indigo-300 font-mono">http://localhost:8080</code> (admin / admin).
            </p>
          </div>

          {/* Docker Compose option */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Option B: Docker Compose (Auto-Import)</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(DOCKER_COMPOSE_YML, 'docker-compose')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Copy docker-compose.yml"
                >
                  {copiedKey === 'docker-compose' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800/80 leading-relaxed">
                {DOCKER_COMPOSE_YML}
              </pre>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Place the downloaded <code className="text-indigo-300 font-mono">sfa-pfa-demo-realm.json</code> next to this file to auto-import on boot!
            </p>
          </div>
        </div>
      </section>

      {/* Method 2: Importing the Realm into Keycloak Admin Console */}
      <section className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Import the Realm in 3 Clicks</h2>
            <p className="text-xs text-slate-400">If you started Keycloak via Option A (standard docker run)</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="font-semibold text-white flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 inline-flex items-center justify-center text-[11px]">1</span>
                <span>Open Admin Console</span>
              </div>
              <p className="text-slate-400">
                Go to <a href="http://localhost:8080" target="_blank" rel="noreferrer" className="text-indigo-400 underline inline-flex items-center space-x-0.5"><span>http://localhost:8080</span><ExternalLink className="w-3 h-3 ml-0.5" /></a>. Log in with user <code className="text-slate-200">admin</code> and password <code className="text-slate-200">admin</code>.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="font-semibold text-white flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 inline-flex items-center justify-center text-[11px]">2</span>
                <span>Create Realm &amp; Import</span>
              </div>
              <p className="text-slate-400">
                Click the Realm dropdown in the top-left sidebar (showing "master"), click <strong>"Create Realm"</strong>, then select <strong>"Browse"</strong> and choose the downloaded <code className="text-indigo-300">sfa-pfa-demo-realm.json</code> file.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="font-semibold text-white flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 inline-flex items-center justify-center text-[11px]">3</span>
                <span>Click Create</span>
              </div>
              <p className="text-slate-400">
                Click <strong>"Create"</strong>. The realm, client <code className="text-indigo-300">react-app</code>, PKCE settings, CORS origins, and test users (<code className="text-slate-200">alex.sfa</code> and <code className="text-slate-200">morgan.pfa</code>) are now ready!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Method 3: Detailed Step-by-Step Manual Keycloak Configuration */}
      <section className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Manual Configuration Breakdown (Under the Hood)</h2>
            <p className="text-xs text-slate-400">If you are configuring your existing realm manually</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Step A: Client settings */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-xs font-mono">Step A</span>
              <span>Client Configuration (<code className="text-indigo-300 font-mono">react-app</code>)</span>
            </h3>
            <p className="text-xs text-slate-300">
              In your realm, navigate to <strong>Clients &gt; Create Client</strong>:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-200">General Settings</span>
                <ul className="list-disc list-inside text-slate-400 space-y-1 mt-1">
                  <li>Client type: <strong>OpenID Connect</strong></li>
                  <li>Client ID: <code className="text-indigo-300">react-app</code></li>
                  <li>Name: <code className="text-slate-300">React SFA &amp; PFA Client</code></li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-200">Capability Config</span>
                <ul className="list-disc list-inside text-slate-400 space-y-1 mt-1">
                  <li>Client authentication: <strong>OFF</strong> (Public client, mandatory for SPAs)</li>
                  <li>Authorization: <strong>OFF</strong></li>
                  <li>Authentication flow: Check <strong>Standard flow</strong> and <strong>Direct access grants</strong></li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 md:col-span-2">
                <span className="font-semibold text-slate-200">Access Settings (CORS &amp; Redirects)</span>
                <ul className="list-disc list-inside text-slate-400 space-y-1.5 mt-1">
                  <li>
                    <strong>Valid redirect URIs</strong>:{' '}
                    <code className="text-slate-300">http://localhost:3000/*</code>,{' '}
                    <code className="text-slate-300">https://ais-dev-sz3fx46ezbpjibfjglorzp-686085722197.europe-west1.run.app/*</code>, or <code className="text-indigo-300">*</code>
                  </li>
                  <li>
                    <strong>Valid post logout redirect URIs</strong>: <code className="text-indigo-300">*</code>
                  </li>
                  <li>
                    <strong className="text-amber-300">Web Origins (CORS)</strong>:{' '}
                    <code className="text-amber-300 font-bold">*</code> (or your app URL).{' '}
                    <span className="text-amber-400">Crucial! Without this, the browser will block token exchange due to CORS policy.</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 md:col-span-2">
                <span className="font-semibold text-slate-200">Advanced Settings (PKCE)</span>
                <p className="text-slate-400 mt-1">
                  Scroll to <strong>Advanced &gt; Proof Key for Code Exchange (PKCE)</strong> and set{' '}
                  <strong className="text-indigo-300">Code Challenge Method</strong> to <code className="text-indigo-300 font-semibold">S256</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Step B: SFA vs PFA Configuration */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs font-mono">Step B</span>
              <span>Configuring SFA and PFA (Level of Assurance / ACR)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* SFA config */}
              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/20 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>SFA: Single-Factor Authentication</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Keycloak's standard <strong>Browser</strong> flow satisfies SFA out of the box:
                </p>
                <ul className="list-disc list-inside text-slate-400 space-y-1">
                  <li>User enters <strong>Username + Password</strong>.</li>
                  <li>Produces token claim <code className="text-amber-300 font-mono">amr: ["pwd"]</code>.</li>
                  <li>Maps to Level of Assurance 1 (<code className="text-amber-300 font-mono">acr: "loa-1"</code>).</li>
                </ul>
                <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px]">
                  <strong>Test User:</strong> Create user <code className="font-mono text-white">alex.sfa</code> with password <code className="font-mono text-white">password123</code>. Do not assign OTP required action.
                </div>
              </div>

              {/* PFA config */}
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>PFA: Protected / Step-Up Factor (LoA 2)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Configured via Keycloak's <strong>Step-Up Authentication</strong> &amp; <strong>Conditional OTP / WebAuthn</strong>:
                </p>
                <ul className="list-disc list-inside text-slate-400 space-y-1">
                  <li>
                    Go to <strong>Authentication &gt; Flows</strong> &gt; Copy <strong>Browser</strong> flow to <code className="text-emerald-300 font-mono">browser-with-pfa</code>.
                  </li>
                  <li>
                    Add execution: <strong>Conditional OTP Form</strong> (or <strong>WebAuthn Authenticator</strong>).
                  </li>
                  <li>
                    Produces token claims <code className="text-emerald-300 font-mono">amr: ["pwd", "otp"]</code> or <code className="text-emerald-300 font-mono">amr: ["webauthn"]</code> with <code className="text-emerald-300 font-mono">acr: "loa-2"</code>.
                  </li>
                </ul>
                <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-[11px]">
                  <strong>Test User:</strong> Create user <code className="font-mono text-white">morgan.pfa</code> with password <code className="font-mono text-white">password123</code>, and set Required Action: <code className="font-mono text-white">Configure OTP</code>.
                </div>
              </div>
            </div>

            {/* ACR Scope Mapping */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                <Code className="w-4 h-4 text-indigo-400" />
                <span>Enabling the ACR / AMR Claim Mapper</span>
              </span>
              <p className="text-slate-400 leading-relaxed">
                To guarantee that the <code className="text-indigo-300">acr</code> and <code className="text-indigo-300">amr</code> claims appear in your ID Token and Access Token:
              </p>
              <ol className="list-decimal list-inside text-slate-300 space-y-1 pl-1">
                <li>Go to <strong>Client Scopes &gt; Create client scope</strong> named <code className="text-indigo-300">acr</code>.</li>
                <li>In Mappers, add predefined mapper: <strong>acr</strong> (type: OpenID Connect ACR Mapper).</li>
                <li>Go to your client <code className="text-indigo-300">react-app</code> &gt; <strong>Client Scopes</strong> &gt; <strong>Add client scope</strong> &gt; select <code className="text-indigo-300">acr</code> as <strong>Default</strong>.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Troubleshooting Matrix */}
      <section className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-sm">
            !
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Troubleshooting Common Keycloak Issues</h2>
            <p className="text-xs text-slate-400">Quick fixes for standard setup stumbling blocks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="font-semibold text-red-400 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>CORS: "Failed to fetch / Origin not allowed"</span>
            </span>
            <p className="text-slate-400">
              <strong>Cause:</strong> Keycloak rejected the preflight OPTIONS request from the browser.
            </p>
            <p className="text-slate-300">
              <strong>Fix:</strong> In Keycloak Admin, go to Clients &gt; <code className="text-indigo-300">react-app</code> &gt; set <strong>Web Origins</strong> to <code className="text-emerald-300 font-bold">*</code> (or the exact URL of this app).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="font-semibold text-amber-400 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Invalid Parameter: "redirect_uri"</span>
            </span>
            <p className="text-slate-400">
              <strong>Cause:</strong> The callback URL in the request doesn't match the allowed list.
            </p>
            <p className="text-slate-300">
              <strong>Fix:</strong> Add <code className="text-indigo-300">*</code> or both <code className="text-slate-200">http://localhost:3000/*</code> and your Cloud Run URL to <strong>Valid redirect URIs</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 md:col-span-2">
            <span className="font-semibold text-purple-400 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Invalid Scope: "Invalid scopes: openid profile email"</span>
            </span>
            <p className="text-slate-400">
              <strong>Cause:</strong> Keycloak client <code className="text-indigo-300">react-app</code> does not have the requested scopes (such as <code className="text-slate-300">profile</code> and <code className="text-slate-300">email</code>) linked under its Client Scopes.
            </p>
            <p className="text-slate-300">
              <strong>Fix 1 (Instant):</strong> Keep the app's OIDC Scope set to <code className="text-emerald-300 font-bold">openid</code>. The <code className="text-emerald-300">openid</code> scope is the core OIDC standard and is guaranteed to work on all Keycloak clients.
            </p>
            <p className="text-slate-300">
              <strong>Fix 2:</strong> In Keycloak Admin Console, go to <strong>Clients &gt; react-app &gt; Client Scopes &gt; Add Client Scope</strong>, select <code className="text-indigo-300 font-mono">profile</code> and <code className="text-indigo-300 font-mono">email</code>, and choose <strong>Default</strong>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
