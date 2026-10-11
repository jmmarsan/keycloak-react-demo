import React from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Server, 
  Sparkles, 
  LogOut, 
  BookOpen 
} from 'lucide-react';

export const Header = ({
  authMode,
  onAuthModeChange,
  session,
  onLogout,
  activeTab,
  onSelectTab,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">Keycloak SFA & PFA</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  OIDC / PKCE
                </span>
              </div>
              <p className="text-xs text-slate-400">Identity Provider Testing & LoA Verification</p>
            </div>
          </div>

          {/* Mode Switcher & Status */}
          <div className="flex items-center space-x-3">
            {/* Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                type="button"
                onClick={() => onAuthModeChange('simulator')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md font-medium transition-all ${
                  authMode === 'simulator'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Built-in simulator: test SFA, PFA and Step-up instantly in the browser"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>IdP Simulator</span>
              </button>
              <button
                type="button"
                onClick={() => onAuthModeChange('live')}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md font-medium transition-all ${
                  authMode === 'live'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Connect to real Keycloak running locally on http://localhost:8080"
              >
                <Server className="w-3.5 h-3.5" />
                <span>Local Keycloak</span>
              </button>
            </div>

            {/* Current Factor Badge */}
            {session ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <div
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    session.factorLevel === 'pfa'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {session.factorLevel === 'pfa' ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  )}
                  <span>{session.factorLevel.toUpperCase()} Session</span>
                </div>

                <div className="hidden md:flex flex-col text-right text-xs">
                  <span className="font-medium text-slate-200">{session.user.username}</span>
                  <span className="text-slate-400 text-[10px]">{session.user.roles[0] || 'User'}</span>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Logout / Terminate Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Not Authenticated
                </span>
              </div>
            )}

            {/* Quick Setup Guide Button */}
            <button
              type="button"
              onClick={() => onSelectTab('guide')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                activeTab === 'guide'
                  ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Setup Keycloak</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
