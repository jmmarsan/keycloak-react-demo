import React from 'react';
import { 
  KeyRound, 
  FileCode, 
  Lock, 
  BookOpen, 
  Activity 
} from 'lucide-react';

export const Navigation = ({
  activeTab,
  onSelectTab,
  factorLevel,
  auditCount,
}) => {
  const tabs = [
    {
      id: 'auth-flows',
      label: 'Testing Console',
      sublabel: 'SFA vs PFA Logins',
      icon: KeyRound,
    },
    {
      id: 'tokens',
      label: 'Token & Session',
      sublabel: 'ACR / AMR Claims',
      icon: FileCode,
      badge: factorLevel !== 'none' ? factorLevel.toUpperCase() : undefined,
      badgeColor: factorLevel === 'pfa' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400',
    },
    {
      id: 'protected',
      label: 'Protected Resources',
      sublabel: 'Step-Up Enforcement',
      icon: Lock,
    },
    {
      id: 'guide',
      label: 'Keycloak Setup Guide',
      sublabel: 'Local Docker & Realm',
      icon: BookOpen,
      highlight: true,
    },
    {
      id: 'audit',
      label: 'Protocol Audit Logs',
      sublabel: 'OIDC Timeline',
      icon: Activity,
      count: auditCount,
    },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-left whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800/80 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-xs sm:text-sm text-slate-100">
                      {tab.label}
                    </span>
                    {tab.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab.badgeColor}`}>
                        {tab.badge}
                      </span>
                    )}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                        {tab.count}
                      </span>
                    )}
                  </div>
                  <span className="block text-[11px] text-slate-400">{tab.sublabel}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
