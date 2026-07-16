import React, { useEffect, useState } from 'react';
import api from '../services/axios';
import { SecurityAlert } from '../types';
import { SecurityHeader, LoadingSpinner, RiskBadge, ErrorCard } from '../components/CommonUI';
import { AlertOctagon, CheckCircle, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await api.get<SecurityAlert[]>('/audit/alerts');
      setAlerts(response.data);
    } catch (err: any) {
      console.error('Incident warnings load failure:', err);
      setErrorMsg('Incidents repository could not be reached. Verify access parameters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await api.post(`/audit/alerts/${id}/resolve`);
      toast.success('Incident resolved and archived successfully.');
      
      // Update alerts state locally instead of full refresh
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === id ? { ...alert, resolved: true } : alert
        )
      );
    } catch (err: any) {
      console.error('Resolution failure:', err);
      const msg = err.response?.data?.detail || 'An error occurred during incident resolution.';
      toast.error(msg);
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SecurityHeader title="Active Security Threats" subtitle="Connecting to incident event triggers..." />
        <LoadingSpinner />
      </div>
    );
  }

  const activeAlerts = alerts.filter((a) => !a.resolved);
  const resolvedAlerts = alerts.filter((a) => a.resolved);

  return (
    <div className="space-y-6">
      <SecurityHeader
        title="Threat Incident Command"
        subtitle="Active alarms requiring human clearance and system resolution"
        action={
          <button
            onClick={loadAlerts}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-950 border border-gray-800 text-gray-400 hover:text-white rounded-lg text-xs font-mono uppercase transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Poll Alerts</span>
          </button>
        }
      />

      {errorMsg ? (
        <ErrorCard message={errorMsg} onRetry={loadAlerts} />
      ) : (
        <div className="space-y-8">
          {/* Active Incidents */}
          <div>
            <h3 className="text-sm font-mono uppercase tracking-widest text-red-400 mb-4 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" />
              Active Incidents ({activeAlerts.length})
            </h3>
            
            {activeAlerts.length === 0 ? (
              <div className="bg-[#111827] border border-gray-800 rounded-xl p-8 text-center text-gray-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
                <CheckCircle className="w-8 h-8 text-[#10B981]" />
                <span>All incident vectors quiet. No active threats detected.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-[#111827] border border-red-500/10 hover:border-red-500/30 transition-all rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group"
                  >
                    <div className="absolute top-0 inset-x-0 h-1 bg-red-500/30" />
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl" />

                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="text-md font-sans font-bold text-white leading-snug">
                          {alert.rule_triggered}
                        </h4>
                        <RiskBadge level={alert.risk_level} />
                      </div>

                      <p className="text-xs font-mono text-gray-400 leading-relaxed bg-gray-950/40 p-3 border border-gray-800/40 rounded-lg">
                        {alert.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 pt-2 border-t border-gray-850">
                        <span>Score Triggered: <strong className="text-white">{alert.risk_score}</strong></span>
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleResolve(alert.id)}
                      disabled={resolvingId === alert.id}
                      className="w-full mt-4 py-2 bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-emerald-500/20 text-[#10B981] font-mono text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {resolvingId === alert.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Closing incident...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Resolve Incident</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resolved/Archive Log */}
          {resolvedAlerts.length > 0 && (
            <div>
              <h3 className="text-sm font-mono uppercase tracking-widest text-[#10B981] mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Incident Archive ({resolvedAlerts.length})
              </h3>

              <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-900/50 border-b border-gray-800 text-[11px] font-mono text-gray-500 uppercase tracking-wider">
                        <th className="p-4">Alarm Code</th>
                        <th className="p-4">Incident Log</th>
                        <th className="p-4">Evaluated Score</th>
                        <th className="p-4 text-right">Date Archived</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50 text-xs font-mono">
                      {resolvedAlerts.map((alert) => (
                        <tr key={alert.id} className="hover:bg-gray-800/10 text-gray-400">
                          <td className="p-4 text-emerald-400 font-semibold">{alert.rule_triggered}</td>
                          <td className="p-4 truncate max-w-xs" title={alert.description}>{alert.description}</td>
                          <td className="p-4 font-bold">{alert.risk_score}</td>
                          <td className="p-4 text-right text-gray-500">
                            {new Date(alert.timestamp).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
