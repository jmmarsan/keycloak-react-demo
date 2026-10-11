import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  ArrowUpRight, 
  DollarSign, 
  Key, 
  Trash2, 
  FileText, 
  Users, 
  CheckCircle2, 
  AlertOctagon 
} from 'lucide-react';

export const ProtectedResourcesScreen = ({
  session,
  onStepUpToPfa,
  onGoToConsole,
  onLogAudit,
}) => {
  const [actionSuccess, setActionSuccess] = useState(null);
  const [deniedAction, setDeniedAction] = useState(null);

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Protected Resources Gated</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Sign in via SFA or PFA on the Testing Console to test how application routes enforce Single-Factor vs Protected-Factor authorization policies.
        </p>
        <button
          type="button"
          onClick={onGoToConsole}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20"
        >
          Go to Testing Console
        </button>
      </div>
    );
  }

  const isPfa = session.factorLevel === 'pfa';

  const handleExecuteSensitiveAction = (actionName) => {
    setActionSuccess(null);
    setDeniedAction(null);

    if (!isPfa) {
      setDeniedAction(actionName);
      onLogAudit({
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: 'RESOURCE_ACCESS_DENIED',
        title: `Access Denied: ${actionName}`,
        detail: `Action requires PFA (LoA 2). Current token only satisfies SFA (acr="${session.acr}", amr=${JSON.stringify(session.amr)})`,
        status: 'warning',
      });
      return;
    }

    setActionSuccess(`Successfully executed: ${actionName}`);
    onLogAudit({
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type: 'RESOURCE_ACCESS_ALLOWED',
      title: `Privileged Action Executed: ${actionName}`,
      detail: `Validated high-assurance token (acr="${session.acr}", amr=${JSON.stringify(session.amr)})`,
      status: 'success',
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Policy Status Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white">Resource Access Control Enforcement</h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isPfa
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              Current: {session.factorLevel.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            This screen demonstrates how enterprise applications evaluate OIDC claims (<code className="text-indigo-300">acr</code> and <code className="text-indigo-300">amr</code>) to enforce step-up authentication before permitting sensitive operations.
          </p>
        </div>

        {!isPfa && (
          <button
            type="button"
            onClick={onStepUpToPfa}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs transition-all shadow-lg shadow-emerald-600/20 shrink-0"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Elevate to PFA Now</span>
          </button>
        )}
      </div>

      {/* Access Denied / Success Banner */}
      {deniedAction && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in text-xs">
          <div className="flex items-start space-x-3">
            <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white text-sm">
                Step-Up Authentication Required
              </span>
              <p className="mt-0.5 text-red-300">
                Action <strong>"{deniedAction}"</strong> is protected by policy <code className="bg-red-900/60 px-1 py-0.5 rounded font-mono">AAL2_MFA_REQUIRED</code>. Your active token is only <code className="font-mono">SFA (LoA 1)</code>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onStepUpToPfa}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold whitespace-nowrap shadow-md self-start sm:self-center"
          >
            Trigger Step-Up (PFA)
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex items-center space-x-3 animate-fade-in text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-white text-sm">Privileged Action Permitted</span>
            <p className="mt-0.5 text-emerald-300">{actionSuccess}</p>
          </div>
        </div>
      )}

      {/* Grid of Two Security Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TIER 1: Standard Access (SFA Permitted) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Tier 1: Standard Services</h3>
                <span className="text-[11px] text-amber-400 font-medium">Requires SFA (LoA 1)</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              Accessible
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Standard read-only user services and general workplace dashboards accessible with basic password authentication.
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-300">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Internal Company News &amp; Wiki</span>
              </div>
              <button
                type="button"
                onClick={() => setActionSuccess('Viewing internal documents.')}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                View
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-300">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Employee Directory &amp; Profile</span>
              </div>
              <button
                type="button"
                onClick={() => setActionSuccess('Viewing employee directory.')}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                View
              </button>
            </div>
          </div>
        </div>

        {/* TIER 2: High Security Operations (Strictly Requires PFA) */}
        <div
          className={`p-6 rounded-2xl border space-y-4 transition-all ${
            isPfa
              ? 'bg-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
              : 'bg-slate-900/60 border-slate-800 opacity-95'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isPfa
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}
              >
                {isPfa ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Tier 2: Protected Security Vault</h3>
                <span
                  className={`text-[11px] font-medium ${
                    isPfa ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  Strictly Demands PFA / MFA (LoA 2)
                </span>
              </div>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isPfa
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}
            >
              {isPfa ? 'Unlocked' : 'Locked (Needs Step-Up)'}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Critical operations requiring phishing-resistant factors or multi-factor authentication. SFA sessions are blocked.
          </p>

          <div className="space-y-2 text-xs">
            {/* Sensitive Action 1 */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-300">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-semibold block text-slate-200">
                    Authorize International Wire ($25,000)
                  </span>
                  <span className="text-[10px] text-slate-400">High-value treasury payment</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleExecuteSensitiveAction('Authorize International Wire ($25,000)')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  isPfa
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Execute
              </button>
            </div>

            {/* Sensitive Action 2 */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-300">
                <Key className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="font-semibold block text-slate-200">
                    Rotate Production API Keys
                  </span>
                  <span className="text-[10px] text-slate-400">Invalidates existing service credentials</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleExecuteSensitiveAction('Rotate Production API Keys')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  isPfa
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Rotate
              </button>
            </div>

            {/* Sensitive Action 3 */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-300">
                <Trash2 className="w-4 h-4 text-red-400" />
                <div>
                  <span className="font-semibold block text-slate-200">
                    Purge Customer Analytics Archive
                  </span>
                  <span className="text-[10px] text-slate-400">Irreversible tenant data deletion</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleExecuteSensitiveAction('Purge Customer Analytics Archive')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  isPfa
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Purge
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
