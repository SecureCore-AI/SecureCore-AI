import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/axios';
import { AuditLog, SecurityAlert, LockedAccount, IntegrityCheckResponse } from '../types';
import {
  SecurityHeader,
  SkeletonCard,
  RiskBadge,
  RoleBadge,
  ErrorCard,
} from '../components/CommonUI';
import {
  ShieldAlert,
  Lock,
  History,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert as ShieldIcon,
  HardDriveDownload,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user, fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [lockedCount, setLockedCount] = useState<number | null>(null);
  const [integrity, setIntegrity] = useState<IntegrityCheckResponse | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async () => {
    if (!user) return;
    setErrorMsg('');
    
    try {
      const results = await Promise.allSettled([
        api.get<AuditLog[]>('/audit/logs?limit=15'),
        api.get<SecurityAlert[]>('/audit/alerts'),
        user.role === 'Super Admin' ? api.get<LockedAccount[]>('/audit/locked-accounts') : Promise.resolve(null),
        api.get<IntegrityCheckResponse>('/audit/integrity-check'),
        fetchUserProfile(), // Update latest risk score/level of logged in operator
      ]);

      // Process logs
      if (results[0].status === 'fulfilled' && results[0].value) {
        setLogs(results[0].value.data);
      }

      // Process alerts
      if (results[1].status === 'fulfilled' && results[1].value) {
        setAlerts(results[1].value.data);
      }

      // Process locked accounts
      if (results[2].status === 'fulfilled' && results[2].value) {
        const lockedData = results[2].value.data;
        if (lockedData) {
          setLockedCount(lockedData.length);
        }
      } else {
        setLockedCount(null);
      }

      // Process integrity
      if (results[3].status === 'fulfilled' && results[3].value) {
        setIntegrity(results[3].value.data);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard indices:', err);
      setErrorMsg('Unable to retrieve full dashboard security matrices. Verify backend connection.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadDashboardData();
  }, [user?.role]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SecurityHeader title="Security Operations Center" subtitle="Gathering cryptographic hashes and active log parameters..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="h-64 bg-[#111827] border border-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Filter out recent privileged actions specifically (e.g. EXPORT_DATA, DELETE_RECORD, etc.)
  const privilegedActions = logs.filter(log => 
    ['GRANT_ROLE', 'DELETE_RECORD', 'DISABLE_LOGGING', 'MODIFIY_PERMISSIONS', 'EXPORT_DATA'].includes(log.action)
  );

  // Today's active alerts (unresolved)
  const activeAlerts = alerts.filter(a => !a.resolved);

  // Risk Trend simulated data points
  const trendData = [
    { time: '08:00', risk: 24 },
    { time: '10:00', risk: user ? Math.max(10, user.risk_score - 15) : 30 },
    { time: '12:00', risk: user ? Math.max(15, user.risk_score - 5) : 45 },
    { time: '14:00', risk: user ? Math.max(35, user.risk_score + 10) : 60 },
    { time: '16:00', risk: user ? user.risk_score : 50 },
    { time: '18:00', risk: user ? Math.max(5, user.risk_score - 10) : 42 },
  ];

  // Helper to resolve risk level color borders and tags
  const getRiskColor = (score: number) => {
    if (score >= 75) return 'text-[#EF4444] drop-shadow-[0_0_10px_rgba(239,68,68,0.2)]';
    if (score >= 45) return 'text-[#F59E0B] drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]';
    return 'text-[#10B981]';
  };

  return (
    <div className="space-y-6">
      <SecurityHeader
        title="Security Operations Center"
        subtitle="AI-driven threat mitigation and active credential monitoring"
        action={
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 text-gray-300 hover:text-white rounded-lg text-xs font-mono tracking-wider uppercase transition-all hover:bg-gray-800 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#00D4FF]' : ''}`} />
            {isRefreshing ? 'Re-auditing...' : 'Trigger Audit'}
          </button>
        }
      />

      {errorMsg && (
        <ErrorCard message={errorMsg} onRetry={loadDashboardData} />
      )}

      {/* Top 4 Cyber Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Risk Score Gauge */}
        <div className="bg-[#111827] border border-gray-800 hover:border-gray-700/60 transition-all rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00D4FF]/5 to-transparent rounded-full blur-2xl group-hover:from-[#00D4FF]/10 transition-all" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Operator Risk Matrix</p>
              <h3 className="text-2xl font-bold tracking-tight text-white mt-1">
                {user?.risk_level} Risk
              </h3>
            </div>
            <div className={`p-2 rounded-lg bg-gray-900 border border-gray-800 ${getRiskColor(user?.risk_score || 0)}`}>
              <ShieldIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-5xl font-mono font-extrabold ${getRiskColor(user?.risk_score || 0)}`}>
              {user?.risk_score}
            </span>
            <span className="text-sm font-mono text-gray-500">/ 100</span>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-4 border-t border-gray-800/60 pt-3">
            Realtime score calculation
          </p>
        </div>

        {/* Active Alerts */}
        <div className="bg-[#111827] border border-gray-800 hover:border-gray-700/60 transition-all rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group" onClick={() => navigate('/alerts')}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/5 to-transparent rounded-full blur-2xl" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Active Threats</p>
              <h3 className="text-2xl font-bold tracking-tight text-white mt-1">Today's Alerts</h3>
            </div>
            <div className={`p-2 rounded-lg bg-gray-900 border border-gray-800 ${activeAlerts.length > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-5xl font-mono font-extrabold ${activeAlerts.length > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
              {activeAlerts.length}
            </span>
            <span className="text-sm font-mono text-gray-500">unresolved</span>
          </div>
          <div className="text-xs text-[#00D4FF] hover:underline flex items-center gap-1 mt-4 border-t border-gray-800/60 pt-3 cursor-pointer">
            <span>Investigate Incidents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Locked Accounts */}
        <div className="bg-[#111827] border border-gray-800 hover:border-gray-700/60 transition-all rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group" onClick={() => user?.role === 'Super Admin' ? navigate('/locked-accounts') : null}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/5 to-transparent rounded-full blur-2xl" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Lock Status</p>
              <h3 className="text-2xl font-bold tracking-tight text-white mt-1">Locked Users</h3>
            </div>
            <div className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-[#F59E0B]">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-mono font-extrabold text-[#F59E0B]">
              {lockedCount !== null ? lockedCount : '—'}
            </span>
            <span className="text-sm font-mono text-gray-500">accounts</span>
          </div>
          {user?.role === 'Super Admin' ? (
            <div className="text-xs text-[#00D4FF] hover:underline flex items-center gap-1 mt-4 border-t border-gray-800/60 pt-3 cursor-pointer">
              <span>Manage Locked Terminals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          ) : (
            <p className="text-xs text-gray-500 font-mono mt-4 border-t border-gray-800/60 pt-3">
              Requires Super Admin clearance
            </p>
          )}
        </div>

        {/* Cryptographic Hash Integrity Check */}
        <div className="bg-[#111827] border border-gray-800 hover:border-gray-700/60 transition-all rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group" onClick={() => navigate('/integrity')}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full blur-2xl" />
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Audit Cryptography</p>
              <h3 className="text-2xl font-bold tracking-tight text-white mt-1">Blockchain Hash</h3>
            </div>
            <div className={`p-2 rounded-lg bg-gray-900 border border-gray-800 ${integrity?.chain_intact ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full ${integrity?.chain_intact ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
              <span className="text-sm font-sans font-medium">
                {integrity?.chain_intact ? 'SECURE_INTACT' : 'HASH_CORRUPT'}
              </span>
            </div>
            <p className="text-xs font-mono text-gray-500">
              Validated: {integrity?.total_blocks || 0} blocks
            </p>
          </div>
          <div className="text-xs text-[#00D4FF] hover:underline flex items-center gap-1 mt-4 border-t border-gray-800/60 pt-3 cursor-pointer">
            <span>Verify Integrity Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Area Chart */}
        <div className="lg:col-span-2 bg-[#111827] border border-gray-800/80 rounded-xl p-6">
          <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00D4FF]" />
            Session Risk Evolution (24-Hour Windows)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00D4FF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <YAxis domain={[0, 100]} stroke="#6b7280" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
                  labelStyle={{ fontFamily: 'monospace', color: '#00D4FF' }}
                />
                <Area type="monotone" dataKey="risk" stroke="#00D4FF" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security Summary & Quick Profile status */}
        <div className="bg-[#111827] border border-gray-800/80 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <ShieldIcon className="w-4 h-4 text-[#00D4FF]" />
              Clearance Authorization
            </h3>
            <div className="space-y-4 bg-gray-950/60 p-4 rounded-xl border border-gray-800/40">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-mono">Terminal Node:</span>
                <span className="text-white font-mono font-bold">{user.username}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-mono">Authorization Rank:</span>
                <RoleBadge role={user.role} />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-mono">Department Sector:</span>
                <span className="text-[#00D4FF] font-mono">{user.department}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-mono">Host Interface:</span>
                <span className="text-gray-400 font-mono">127.0.0.1</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => navigate('/action')}
              className="w-full py-2.5 bg-gradient-to-r from-[#00D4FF]/20 to-[#00D4FF]/10 hover:from-[#00D4FF]/30 hover:to-[#00D4FF]/20 border border-[#00D4FF]/30 text-white rounded-lg text-xs font-mono tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-[#00D4FF]" />
              Perform Privileged Action
            </button>
          </div>
        </div>
      </div>

      {/* Action list vs Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Privileged Actions */}
        <div className="bg-[#111827] border border-gray-800/80 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Recent Privileged Operations
            </h3>
            {privilegedActions.length > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded">
                CRITICAL TARGETS
              </span>
            )}
          </div>
          {privilegedActions.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-xs font-mono">
              No recent elevated actions detected.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-[10px] font-mono text-gray-500 uppercase tracking-wider pb-2">
                    <th className="pb-2 font-medium">Operator</th>
                    <th className="pb-2 font-medium">Operation</th>
                    <th className="pb-2 font-medium">Resource</th>
                    <th className="pb-2 text-right font-medium">Risk Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-xs font-mono">
                  {privilegedActions.slice(0, 5).map((log, idx) => (
                    <tr key={idx} className="hover:bg-gray-900/40 transition-colors">
                      <td className="py-2.5 text-white">{log.username}</td>
                      <td className="py-2.5 text-yellow-500">{log.action}</td>
                      <td className="py-2.5 text-gray-400 truncate max-w-[120px]" title={log.resource}>{log.resource}</td>
                      <td className="py-2.5 text-right font-bold text-red-400">{log.risk_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Audit Logs */}
        <div className="bg-[#111827] border border-gray-800/80 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <History className="w-4 h-4 text-[#10B981]" />
              Recent Audit Stream
            </h3>
            <button
              onClick={() => navigate('/logs')}
              className="text-xs font-mono text-[#00D4FF] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Full Ledger
              <ArrowRight className="w-3" />
            </button>
          </div>
          {logs.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-xs font-mono">
              Terminal log stream is empty.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-[10px] font-mono text-gray-500 uppercase tracking-wider pb-2">
                    <th className="pb-2 font-medium">Timestamp</th>
                    <th className="pb-2 font-medium">Operator</th>
                    <th className="pb-2 font-medium">Action</th>
                    <th className="pb-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-xs font-mono">
                  {logs.slice(0, 5).map((log, idx) => (
                    <tr key={idx} className="hover:bg-gray-900/40 transition-colors">
                      <td className="py-2.5 text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 text-white">{log.username}</td>
                      <td className="py-2.5 text-gray-300 truncate max-w-[120px]" title={log.action}>{log.action}</td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {log.success ? 'OK' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
