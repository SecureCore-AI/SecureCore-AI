import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/axios';
import { User } from '../types';
import { SecurityHeader, LoadingSpinner, RoleBadge, RiskBadge, ErrorCard } from '../components/CommonUI';
import { UserCheck, ShieldCheck, Mail, Building, Key, Activity, Calendar, Lock } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, fetchUserProfile } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadProfile = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      await fetchUserProfile(); // sync context state
      const response = await api.get<User>('/privileged/me');
      setProfile(response.data);
    } catch (err: any) {
      console.error('Failed to load profile details:', err);
      setErrorMsg('Unauthorized context signature. Refused connection to identity service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SecurityHeader title="Security Clearance Dossier" subtitle="Decrypting biometric and system identity logs..." />
        <LoadingSpinner />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="space-y-6">
        <SecurityHeader title="Security Clearance Dossier" />
        <ErrorCard message={errorMsg} onRetry={loadProfile} />
      </div>
    );
  }

  const activeUser = profile || user;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <SecurityHeader
        title="Security Clearance Dossier"
        subtitle="Cryptographically verified identity parameters and clearance rank"
      />

      {activeUser && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity Dossier Card */}
          <div className="md:col-span-1 bg-[#111827] border border-gray-800 rounded-2xl p-6 text-center flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#00D4FF]" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#00D4FF]/5 rounded-full blur-xl" />

            <div className="space-y-4">
              <div className="mx-auto w-24 h-24 bg-gray-950 border-2 border-gray-800 rounded-full flex items-center justify-center relative group">
                <UserCheck className="w-12 h-12 text-[#00D4FF] group-hover:scale-105 transition-transform" />
                <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-950" />
              </div>

              <div>
                <h3 className="text-xl font-sans font-extrabold text-white">{activeUser.username}</h3>
                <p className="text-xs font-mono text-gray-500 mt-1 uppercase tracking-wider">{activeUser.department} Sector</p>
              </div>

              <div className="flex justify-center gap-2 pt-2">
                <RoleBadge role={activeUser.role} />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-800/60 space-y-2">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Clearance Status</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[#10B981] rounded-full text-xs font-mono font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                {activeUser.account_status || 'ACTIVE_GRANTED'}
              </div>
            </div>
          </div>

          {/* Core Parameters Ledger */}
          <div className="md:col-span-2 bg-[#111827] border border-gray-800 rounded-2xl p-8 relative">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#00D4FF] to-transparent" />
            
            <h3 className="text-sm font-mono uppercase tracking-widest text-[#00D4FF] mb-6 border-b border-gray-800/80 pb-3 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Security Signature & Vector Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800/40 flex items-center gap-3">
                <div className="p-2 bg-gray-900 border border-gray-800 text-[#00D4FF] rounded-lg">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Terminal Email</p>
                  <p className="text-sm font-semibold text-white truncate max-w-[200px]">{activeUser.email}</p>
                </div>
              </div>

              <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800/40 flex items-center gap-3">
                <div className="p-2 bg-gray-900 border border-gray-800 text-[#00D4FF] rounded-lg">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Assigned Sector</p>
                  <p className="text-sm font-semibold text-white">{activeUser.department}</p>
                </div>
              </div>

              <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800/40 flex items-center gap-3">
                <div className="p-2 bg-gray-900 border border-gray-800 text-[#00D4FF] rounded-lg">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Current Risk Index</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-white">{activeUser.risk_score} / 100</span>
                    <RiskBadge level={activeUser.risk_level} />
                  </div>
                </div>
              </div>

              <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800/40 flex items-center gap-3">
                <div className="p-2 bg-gray-900 border border-gray-800 text-[#00D4FF] rounded-lg">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Last Sync Session</p>
                  <p className="text-xs font-mono text-gray-300">
                    {activeUser.last_login ? new Date(activeUser.last_login).toLocaleString() : 'Just now'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-gray-900/60 p-4 border border-gray-800 rounded-xl space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#00D4FF] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Security Cryptographic Token
              </h4>
              <p className="text-[11px] font-mono text-gray-500 leading-relaxed truncate">
                Bearer Token is kept strictly in-memory inside React state to prevent local filesystem exploits or cache stealing attacks. Ensure page remains active or re-authorize.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
