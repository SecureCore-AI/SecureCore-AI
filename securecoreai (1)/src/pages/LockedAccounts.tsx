import React, { useEffect, useState } from 'react';
import api from '../services/axios';
import { useAuth } from '../context/AuthContext';
import { LockedAccount } from '../types';
import { SecurityHeader, LoadingSpinner, RoleBadge, ErrorCard } from '../components/CommonUI';
import { Lock, Unlock, ShieldAlert, Users, Terminal, CheckCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const LockedAccounts: React.FC = () => {
  const { user } = useAuth();
  const [lockedList, setLockedList] = useState<LockedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const loadLockedAccounts = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await api.get<LockedAccount[]>('/audit/locked-accounts');
      setLockedList(response.data);
    } catch (err: any) {
      console.error('Failed to load locked accounts:', err);
      if (err.response?.status === 403) {
        setErrorMsg('Clearance Exception: Elevated clearance (Super Admin) is required.');
      } else {
        setErrorMsg('Security directory report failure. Locked register unreachable.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Super Admin') {
      loadLockedAccounts();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Route protection layout rendering (403 fallback)
  if (user?.role !== 'Super Admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-xl mx-auto space-y-6">
        <div className="p-4 bg-red-500/10 border-2 border-red-500/30 text-[#EF4444] rounded-full">
          <ShieldAlert className="w-16 h-16 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-mono font-extrabold text-white tracking-wider">
            HTTP 403: REFUSED_ACCESS
          </h1>
          <p className="text-xs font-mono text-red-500 uppercase tracking-widest">
            Operator Clearance Violation
          </p>
        </div>
        <p className="text-sm text-gray-400 font-sans leading-relaxed">
          Access is denied. Your credential matrix does not possess Super Admin clearance tags required to modify locked security vaults.
        </p>
      </div>
    );
  }

  const handleUnlock = async (userId: string, username: string) => {
    setUnlockingId(userId);
    try {
      await api.post(`/audit/locked-accounts/${userId}/unlock`);
      toast.success(`Operator ${username} unlocked successfully.`);
      
      // Update local state directly
      setLockedList((prev) => prev.filter((acc) => acc.user_id !== userId));
    } catch (err: any) {
      console.error('Unlock process failure:', err);
      const msg = err.response?.data?.detail || 'An error occurred during account unlock.';
      toast.error(msg);
    } finally {
      setUnlockingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SecurityHeader title="Locked Accounts Manager" subtitle="Retrieving locked terminal sessions..." />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SecurityHeader
        title="Locked Operator Accounts"
        subtitle="Review security lockout registers and restore operator access keys"
      />

      {errorMsg ? (
        <ErrorCard message={errorMsg} onRetry={loadLockedAccounts} />
      ) : (
        <div className="space-y-4">
          <div className="bg-[#111827] border border-gray-800 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-500/10 text-yellow-500 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Threat Lockdown Ledger</h4>
                <p className="text-xs text-gray-400 font-sans">
                  Suspended sessions awaiting cryptographic validation
                </p>
              </div>
            </div>
            <span className="text-xs font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full font-bold">
              {lockedList.length} RESTRICTED
            </span>
          </div>

          {lockedList.length === 0 ? (
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-12 text-center text-gray-400 font-mono text-xs flex flex-col items-center justify-center gap-3">
              <CheckCircle className="w-10 h-10 text-[#10B981]" />
              <span>All active accounts verified. Lockdown register is currently clear.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {lockedList.map((account) => (
                <div
                  key={account.user_id}
                  className="bg-[#111827] border border-gray-800 rounded-2xl p-6 relative overflow-hidden group hover:border-yellow-500/20 transition-all flex flex-col justify-between"
                >
                  <div className="absolute top-0 inset-x-0 h-1 bg-yellow-500/40" />

                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-lg font-sans font-extrabold text-white">
                          {account.username}
                        </h4>
                        <span className="text-[10px] font-mono text-gray-500">
                          ID: {account.user_id}
                        </span>
                      </div>
                      <RoleBadge role={account.role} />
                    </div>

                    <div className="bg-gray-950/40 p-4 border border-gray-850 rounded-xl space-y-1">
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                        Lockout Incident Reason:
                      </span>
                      <p className="text-xs font-mono text-gray-300">
                        {account.reason || 'Anomaly detection trigger limit exceeded.'}
                      </p>
                    </div>

                    {account.locked_at && (
                      <p className="text-[10px] font-mono text-gray-500">
                        Lock Timestamp: {new Date(account.locked_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleUnlock(account.user_id, account.username)}
                    disabled={unlockingId === account.user_id}
                    className="w-full mt-6 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 hover:border-yellow-500/40 text-yellow-500 font-mono text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {unlockingId === account.user_id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Restoring Key Matrix...</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Reactivate Account</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
