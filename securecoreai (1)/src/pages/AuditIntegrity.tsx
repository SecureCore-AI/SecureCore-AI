import React, { useEffect, useState } from 'react';
import api from '../services/axios';
import { IntegrityCheckResponse } from '../types';
import { SecurityHeader, LoadingSpinner, ErrorCard } from '../components/CommonUI';
import { ShieldAlert, ShieldCheck, Database, RefreshCw, Layers, AlertCircle, FileLock } from 'lucide-react';
import toast from 'react-hot-toast';

export const AuditIntegrity: React.FC = () => {
  const [integrity, setIntegrity] = useState<IntegrityCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [checking, setChecking] = useState(false);

  const loadIntegrityState = async () => {
    try {
      if (!checking) setLoading(true);
      setErrorMsg('');
      const response = await api.get<IntegrityCheckResponse>('/audit/integrity-check');
      setIntegrity(response.data);
    } catch (err: any) {
      console.error('Integrity audit exception:', err);
      setErrorMsg('Audit cryptographic ledger could not be matched. Refused cryptographic handshake.');
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    loadIntegrityState();
  }, []);

  const handleVerify = () => {
    setChecking(true);
    toast.promise(
      api.get<IntegrityCheckResponse>('/audit/integrity-check').then((res) => {
        setIntegrity(res.data);
        setChecking(false);
        return res.data;
      }),
      {
        loading: 'Decrypting ledger hashes and validating cryptographic signatures...',
        success: (data) => 
          data.chain_intact 
            ? 'Cryptographic integrity verified. Blockchain chain completely intact.' 
            : 'TAMPER_ALERT: Hash mismatches detected inside log blocks!',
        error: 'Integrity lookup failed. Key registry unreachable.'
      }
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SecurityHeader title="Audit Log Integrity Verification" subtitle="Running ledger hash algorithms..." />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <SecurityHeader
        title="Audit Integrity ledger"
        subtitle="Cryptographically verified blockchain blocks preventing unauthorized log manipulation"
        action={
          <button
            onClick={handleVerify}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 border border-[#00D4FF]/20 text-[#00D4FF] rounded-lg text-xs font-mono tracking-wider uppercase transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Hashing Ledger...' : 'Run Cryptographic Scan'}</span>
          </button>
        }
      />

      {errorMsg ? (
        <ErrorCard message={errorMsg} onRetry={loadIntegrityState} />
      ) : integrity ? (
        <div className="space-y-6">
          {/* Main Visual Verification Shield */}
          {integrity.chain_intact ? (
            /* Green Intact View */
            <div className="bg-gradient-to-br from-emerald-950/25 to-[#111827] border border-[#10B981]/20 rounded-2xl p-8 md:p-10 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="inline-flex p-4 bg-[#10B981]/10 border-2 border-[#10B981]/20 text-[#10B981] rounded-full mb-6">
                <ShieldCheck className="w-16 h-16 animate-pulse" />
              </div>

              <div className="space-y-2 mb-8">
                <h2 className="text-3xl font-sans font-extrabold text-white tracking-tight">
                  LEDGER INTEGRITY VERIFIED
                </h2>
                <p className="text-xs font-mono text-[#10B981] uppercase tracking-widest font-bold">
                  Status: CHAIN_SECURE_INTACT (chain_intact = true)
                </p>
              </div>

              <p className="text-sm text-gray-400 font-sans max-w-xl mx-auto leading-relaxed">
                Log blockchain matches current cryptographic root block parameters. No anomalies, silent deletions, or history modifications detected in stored log registers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 max-w-2xl mx-auto">
                <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-4">
                  <p className="text-[10px] font-mono text-gray-500 uppercase">Validated Blocks</p>
                  <p className="text-xl font-bold font-mono text-white mt-1">{integrity.total_blocks}</p>
                </div>
                <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-4">
                  <p className="text-[10px] font-mono text-gray-500 uppercase">Hash Mismatch count</p>
                  <p className="text-xl font-bold font-mono text-[#10B981] mt-1">{integrity.hash_mismatch_count}</p>
                </div>
                <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-4">
                  <p className="text-[10px] font-mono text-gray-500 uppercase">Verification Stamp</p>
                  <p className="text-[11px] font-mono text-gray-300 mt-2 truncate">
                    {integrity.last_checked_at ? new Date(integrity.last_checked_at).toLocaleTimeString() : 'Current Sync'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Red Corrupted/Tampered View */
            <div className="bg-gradient-to-br from-red-950/25 to-[#111827] border border-red-500/30 rounded-2xl p-8 md:p-10 text-center relative overflow-hidden shadow-2xl animate-pulse">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="inline-flex p-4 bg-red-500/15 border-2 border-red-500/30 text-red-500 rounded-full mb-6">
                <ShieldAlert className="w-16 h-16 animate-bounce" />
              </div>

              <div className="space-y-2 mb-8">
                <h2 className="text-3xl font-sans font-extrabold text-[#EF4444] tracking-tight">
                  WARNING: TAMPER_DETECTION
                </h2>
                <p className="text-xs font-mono text-[#EF4444] uppercase tracking-widest font-bold">
                  Status: SECURITY_CHAIN_COMPROMISED (chain_intact = false)
                </p>
              </div>

              <p className="text-sm text-gray-400 font-sans max-w-xl mx-auto leading-relaxed">
                Critical Alert! Log integrity scanning detected unauthorized modifications, deleted history ranges, or manual SQL table updates outside of standard API routines.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 max-w-2xl mx-auto">
                <div className="bg-gray-950/80 border border-red-500/20 rounded-xl p-4">
                  <p className="text-[10px] font-mono text-gray-500 uppercase">Total Checked Blocks</p>
                  <p className="text-xl font-bold font-mono text-white mt-1">{integrity.total_blocks}</p>
                </div>
                <div className="bg-gray-950/80 border border-red-500/20 rounded-xl p-4">
                  <p className="text-[10px] font-mono text-gray-500 uppercase">Tampered Blocks Found</p>
                  <p className="text-xl font-bold font-mono text-[#EF4444] mt-1">{integrity.hash_mismatch_count}</p>
                </div>
                <div className="bg-gray-950/80 border border-red-500/20 rounded-xl p-4">
                  <p className="text-[10px] font-mono text-gray-500 uppercase">Threat Level</p>
                  <p className="text-xs font-mono text-[#EF4444] font-bold mt-2 uppercase">
                    IMMEDIATE LOCKDOWN
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cryptographic Info block */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-mono uppercase tracking-widest text-[#00D4FF] mb-4 flex items-center gap-2">
              <Database className="w-4 h-4" />
              How Ledger Cryptography Protects logs
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              SecureCoreAI logs audit transactions sequentially. Every audit entry is cryptographically linked to the previous block via secure SHA-256 hash digests. If an attacker updates, modifies, or deletes an entry directly inside the database, the hash verification chain breaks instantly, creating a mismatch warning report during scan execution.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-10 text-center text-gray-500 text-xs font-mono">
          Run Scan to inspect audit chain hashes.
        </div>
      )}
    </div>
  );
};
