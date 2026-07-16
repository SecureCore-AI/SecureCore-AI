import React, { useEffect, useState } from 'react';
import api from '../services/axios';
import { AuditLog } from '../types';
import { SecurityHeader, SkeletonTable, ErrorCard } from '../components/CommonUI';
import { FileCode, Search, ChevronDown, ChevronUp, Download, Eye, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';

type SortKey = 'timestamp' | 'username' | 'action' | 'resource' | 'ip_address' | 'risk_score';
type SortOrder = 'asc' | 'desc';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting states
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadLogs = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await api.get<AuditLog[]>('/audit/logs?limit=50');
      setLogs(response.data);
    } catch (err: any) {
      console.error('Audit list extraction failure:', err);
      setErrorMsg('Audit terminal failure. Log registry reports refused connection parameters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Filter logs based on search term
  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (
      (log.username || "").toLowerCase().includes(term) ||
      (log.action || "").toLowerCase().includes(term) ||
      (log.resource || "").toLowerCase().includes(term) ||
      (log.ip_address || "").toLowerCase().includes(term) ||
      (log.risk_level || "").toLowerCase().includes(term)
    );
  });

  // Sort logs
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let valA = a[sortKey];
    let valB = b[sortKey];

    // Handle string capitalization issues
    if (typeof valA === 'string' && typeof valB === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated logs
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = sortedLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / itemsPerPage));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Export to CSV helper
  const exportToCSV = () => {
    if (sortedLogs.length === 0) {
      toast.error('No log records currently loaded for compile.');
      return;
    }

    const headers = ['Timestamp', 'Username', 'Action', 'Resource', 'IP Address', 'Success', 'Risk Score', 'Risk Level'];
    const rows = sortedLogs.map((log) => [
      log.timestamp,
      `"${log.username}"`,
      `"${log.action}"`,
      `"${log.resource.replace(/"/g, '""')}"`,
      log.ip_address,
      log.success ? 'TRUE' : 'FALSE',
      log.risk_score,
      log.risk_level || 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'securecoreai_audit_ledger.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Audit ledger compiled and downloaded successfully.');
  };

  return (
    <div className="space-y-6">
      <SecurityHeader
        title="Audit Logs Registry"
        subtitle="Cryptographically logged session transactions and query evaluations"
        action={
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 border border-[#00D4FF]/20 text-[#00D4FF] rounded-lg text-xs font-mono tracking-wider uppercase transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        }
      />

      {errorMsg ? (
        <ErrorCard message={errorMsg} onRetry={loadLogs} />
      ) : loading ? (
        <SkeletonTable rows={10} />
      ) : (
        <div className="space-y-4">
          {/* Filters controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#111827] border border-gray-800 p-4 rounded-xl">
            <div className="relative w-full sm:max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search log ledger (username, resource, IP, action)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] transition-all font-mono"
              />
            </div>

            <div className="text-xs font-mono text-gray-400">
              Filtered Result: <span className="text-[#00D4FF]">{filteredLogs.length}</span> / {logs.length} entries
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900/50 border-b border-gray-800 text-xs font-mono text-gray-400 uppercase tracking-wider select-none">
                    <th className="p-4 cursor-pointer hover:bg-gray-800/40" onClick={() => handleSort('timestamp')}>
                      <div className="flex items-center gap-1">
                        Timestamp
                        {sortKey === 'timestamp' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-gray-800/40" onClick={() => handleSort('username')}>
                      <div className="flex items-center gap-1">
                        User
                        {sortKey === 'username' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-gray-800/40" onClick={() => handleSort('action')}>
                      <div className="flex items-center gap-1">
                        Action
                        {sortKey === 'action' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-gray-800/40" onClick={() => handleSort('resource')}>
                      <div className="flex items-center gap-1">
                        Resource
                        {sortKey === 'resource' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-gray-800/40" onClick={() => handleSort('ip_address')}>
                      <div className="flex items-center gap-1">
                        IP Address
                        {sortKey === 'ip_address' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right cursor-pointer hover:bg-gray-800/40" onClick={() => handleSort('risk_score')}>
                      <div className="flex items-center justify-end gap-1">
                        Risk
                        {sortKey === 'risk_score' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-xs font-mono">
                  {currentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        No matches found in security log stream.
                      </td>
                    </tr>
                  ) : (
                    currentLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-gray-800/20 transition-colors">
                        <td className="p-4 text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-4 text-white font-semibold">
                          {log.username}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${['GRANT_ROLE', 'DELETE_RECORD', 'DISABLE_LOGGING', 'MODIFIY_PERMISSIONS'].includes(log.action)
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-blue-500/10 text-[#00D4FF] border border-blue-500/20'
                            }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-gray-300 max-w-xs truncate" title={log.resource}>
                          {log.resource}
                        </td>
                        <td className="p-4 text-gray-400">{log.ip_address}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {log.success ? 'SUCCESS' : 'FAIL'}
                          </span>
                        </td>
                        <td className={`p-4 text-right font-bold ${log.risk_score >= 75 ? 'text-[#EF4444]' : log.risk_score >= 45 ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
                          {log.risk_score}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="px-6 py-4 bg-gray-900/40 border-t border-gray-800 flex items-center justify-between select-none">
              <span className="text-xs font-mono text-gray-500">
                Page {currentPage} of {totalPages}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-gray-950 border border-gray-800 text-gray-400 hover:text-white rounded text-xs font-mono disabled:opacity-30 disabled:hover:text-gray-400 transition-all cursor-pointer"
                >
                  PREV
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-gray-950 border border-gray-800 text-gray-400 hover:text-white rounded text-xs font-mono disabled:opacity-30 disabled:hover:text-gray-400 transition-all cursor-pointer"
                >
                  NEXT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
