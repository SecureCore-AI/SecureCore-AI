import React, { useState } from 'react';
import api from '../services/axios';
import { useAuth } from '../context/AuthContext';
import { PrivilegedActionPayload, PrivilegedActionResponse } from '../types';
import { SecurityHeader, RiskBadge } from '../components/CommonUI';
import { Zap, AlertOctagon, Terminal, ShieldAlert, CheckCircle, Lock, RefreshCw, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

export const PerformAction: React.FC = () => {
  const { user, fetchUserProfile } = useAuth();
  
  const [action, setAction] = useState<PrivilegedActionPayload['action']>('READ_RECORD');
  const [resource, setResource] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedReason, setLockedReason] = useState('Privileged threat index exceeded risk limits. Account safety locked.');
  const [actionResult, setActionResult] = useState<PrivilegedActionResponse | null>(null);

  const availableActions: PrivilegedActionPayload['action'][] = [
    'READ_RECORD',
    'EXPORT_DATA',
    'GRANT_ROLE',
    'DELETE_RECORD',
    'DISABLE_LOGGING',
    'MODIFIY_PERMISSIONS',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource.trim()) {
      toast.error('Resource identification string is required.');
      return;
    }

    setSubmitting(true);
    setActionResult(null);

    try {
      const response = await api.post<PrivilegedActionResponse>('/privileged/action', {
        action,
        resource: resource.trim(),
      });

      setActionResult(response.data);
      
      // Update our context user state to get the updated risk score
      fetchUserProfile();

      if (response.data.success) {
        toast.success(`Action Executed. Security score evaluated to ${response.data.risk_score}`);
      } else {
        toast.error('Action failed risk clearance validation.');
      }
    } catch (err: any) {
      console.error('Action execution failure:', err);
      
      if (err.response && err.response.status === 423) {
        setIsLocked(true);
        if (err.response.data?.detail) {
          setLockedReason(err.response.data.detail);
        }
        toast.error('SYSTEM SHUTDOWN: This account has been LOCKED due to suspicious activity!', {
          duration: 10000,
          id: 'account-locked-toast'
        });
      } else {
        const errorText = err.response?.data?.detail || 'An unexpected exception occurred during role escalation.';
        toast.error(errorText);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetLock = () => {
    setIsLocked(false);
    setActionResult(null);
    setResource('');
    fetchUserProfile();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      {/* Fullscreen Warning Dialog if Account Locked */}
      {isLocked && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-center items-center p-6 text-center backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ef4444_1px,transparent_1px),linear-gradient(to_bottom,#ef4444_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-5 pointer-events-none" />
          
          <div className="w-full max-w-lg space-y-6 border-2 border-[#EF4444] rounded-2xl bg-[#0C0202] p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-pulse">
            <div className="inline-flex p-4 bg-red-500/10 border-2 border-[#EF4444] rounded-full mb-2">
              <Lock className="w-16 h-16 text-[#EF4444]" />
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-mono font-extrabold tracking-widest text-[#EF4444]">
                ACCOUNT LOCKED
              </h1>
              <p className="text-xs font-mono text-red-500 uppercase tracking-widest">
                Security Protocol Active (HTTP 423)
              </p>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl text-left">
              <p className="text-xs font-mono text-gray-400">Lock Reason:</p>
              <p className="text-sm font-sans font-medium text-white mt-1">
                {lockedReason}
              </p>
              <p className="text-[10px] font-mono text-red-400 mt-4 leading-normal">
                Anomalous action sequence triggered insider threat indicators. Cleared logs are frozen. All terminal sessions invalidated.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <p className="text-xs text-gray-500 font-sans">
                Please contact a <span className="font-semibold text-white">Super Admin</span> to request manual credential reinstatement.
              </p>
              {user?.role === 'Super Admin' && (
                <button
                  onClick={handleResetLock}
                  className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-white rounded-lg text-xs font-mono tracking-wide transition-all"
                >
                  Super Admin Overwrite (Reset Lock State)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <SecurityHeader
        title="Perform Privileged Action"
        subtitle="Submit transactional query parameters to automated AI risk validation engine"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* escalation form */}
        <div className="md:col-span-2 bg-[#111827] border border-gray-800 rounded-2xl p-6 relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-[#00D4FF]" />
          
          <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2 pb-3 border-b border-gray-800/60">
            <Terminal className="w-4 h-4 text-[#00D4FF]" />
            Role Escalation Request
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Privileged Operation Action
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as PrivilegedActionPayload['action'])}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#00D4FF] transition-all font-mono"
                disabled={submitting}
              >
                {availableActions.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                Target Resource Identification
              </label>
              <input
                type="text"
                required
                placeholder="e.g. app-prod-db-customer-table"
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] transition-all font-mono"
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#00D4FF] hover:bg-[#00c2eb] active:scale-[0.99] text-black font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Auditing Risk Matrix...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-black" />
                  <span>Execute Privileged Operation</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* risk instructions and results side panel */}
        <div className="md:col-span-1 space-y-6">
          {/* Action Result panel */}
          {actionResult ? (
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4 animate-in fade-in duration-300">
              <h3 className="text-sm font-mono uppercase tracking-widest text-[#00D4FF] flex items-center gap-1.5 pb-2 border-b border-gray-800/60">
                {actionResult.success ? (
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
                )}
                Audit Clearance
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-mono">Execution State:</span>
                  <span className={`font-bold font-mono px-2 py-0.5 rounded ${actionResult.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {actionResult.success ? 'GRANTED' : 'DENIED'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-mono">Assigned Score:</span>
                  <span className="font-extrabold text-white text-lg font-mono">{actionResult.risk_score}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-mono">Risk Status:</span>
                  <RiskBadge level={actionResult.risk_level} />
                </div>
              </div>

              {/* Triggered rules lists */}
              <div className="pt-2">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
                  Triggered Safety Rules:
                </p>
                {actionResult.triggered_rules && actionResult.triggered_rules.length > 0 ? (
                  <div className="space-y-1.5">
                    {actionResult.triggered_rules.map((rule, idx) => (
                      <div key={idx} className="bg-red-500/10 border border-red-500/20 rounded p-2 text-[11px] font-mono text-red-400 flex items-start gap-1.5">
                        <AlertOctagon className="w-3.5 h-3.5 text-[#EF4444] mt-0.5 flex-shrink-0" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-2 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Clean execution index</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-widest text-[#00D4FF] flex items-center gap-1.5 pb-2 border-b border-gray-800/60">
                <Layers className="w-4 h-4" />
                Risk Control Protocols
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                Every action escalates your risk score temporarily based on the target resource sensitivity and operational frequency.
              </p>
              <div className="bg-gray-950/60 p-3.5 border border-gray-800 rounded-xl space-y-2 text-[11px] font-mono">
                <p className="text-white font-semibold">Active Alarm Boundaries:</p>
                <ul className="list-disc pl-4 space-y-1 text-gray-500">
                  <li>EXPORT_DATA (escalates 25pts)</li>
                  <li>DELETE_RECORD (escalates 40pts)</li>
                  <li>Risk {'>'} 80 triggers instant lock state</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
