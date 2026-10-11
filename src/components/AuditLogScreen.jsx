import React, { useState } from 'react';
import { 
  Activity, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  XCircle, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

export const AuditLogScreen = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const copyPayload = (payload, id) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      {/* Header & Controls */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">OIDC &amp; Security Protocol Timeline</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time trace of cryptographic nonces, Keycloak redirects, PKCE exchanges, AMR/ACR assertions, and step-up challenges.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {['all', 'success', 'warning', 'error'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilter(mode)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                  filter === mode
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClearLogs}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
            title="Clear all log events"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Log items */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
            No audit events found matching current filter.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            const StatusIcon =
              log.status === 'success'
                ? CheckCircle2
                : log.status === 'error'
                ? XCircle
                : log.status === 'warning'
                ? AlertTriangle
                : Info;

            const statusColors =
              log.status === 'success'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : log.status === 'error'
                ? 'text-red-400 bg-red-500/10 border-red-500/20'
                : log.status === 'warning'
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';

            return (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className={`p-1.5 rounded-lg border ${statusColors} shrink-0 mt-0.5`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{log.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {log.type}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-300 mt-0.5">{log.detail}</p>
                    </div>
                  </div>

                  {log.payload ? (
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyPayload(log.payload, log.id)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        title="Copy JSON payload"
                      >
                        {copiedId === log.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        title="Toggle payload"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ) : null}
                </div>

                {isExpanded && log.payload ? (
                  <div className="mt-3 pt-3 border-t border-slate-800 animate-fade-in font-mono text-[11px]">
                    <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto leading-relaxed max-h-72">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
