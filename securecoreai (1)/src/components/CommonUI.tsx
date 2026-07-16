import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`relative ${sizeClasses[size]} rounded-full border-gray-800 border-t-[#00D4FF] animate-spin`} />
      <span className="mt-4 text-xs font-mono text-gray-400 tracking-widest animate-pulse uppercase">
        Verifying Security Matrix...
      </span>
    </div>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-[#111827] border border-gray-800/80 rounded-xl p-6 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-4 w-1/3 bg-gray-800 rounded" />
        <div className="h-8 w-8 bg-gray-800 rounded-full" />
      </div>
      <div className="h-8 w-1/2 bg-gray-800 rounded" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-gray-800 rounded" />
        <div className="h-3 w-4/5 bg-gray-800 rounded" />
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-[#111827] border border-gray-800/80 rounded-xl overflow-hidden animate-pulse">
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
        <div className="h-5 w-1/4 bg-gray-800 rounded" />
        <div className="h-8 w-20 bg-gray-800 rounded" />
      </div>
      <div className="p-6 space-y-4">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex justify-between items-center border-b border-gray-800/40 pb-4 last:border-0 last:pb-0">
            <div className="h-4 w-1/6 bg-gray-800 rounded" />
            <div className="h-4 w-1/4 bg-gray-800 rounded" />
            <div className="h-4 w-1/12 bg-gray-800 rounded" />
            <div className="h-4 w-1/6 bg-gray-800 rounded" />
            <div className="h-4 w-1/12 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const RiskBadge: React.FC<{ level: string | undefined }> = ({ level }) => {
  if (!level) return null;
  const normalized = level.toLowerCase();
  
  let colorClass = 'bg-emerald-500/10 text-[#10B981] border-emerald-500/20';
  if (normalized === 'medium') {
    colorClass = 'bg-amber-500/10 text-[#F59E0B] border-amber-500/20';
  } else if (normalized === 'high') {
    colorClass = 'bg-rose-500/10 text-[#EF4444] border-rose-500/20';
  } else if (normalized === 'critical') {
    colorClass = 'bg-red-500/20 text-[#EF4444] border-red-500/40 animate-pulse border font-bold';
  }

  return (
    <span className={`px-2.5 py-1 text-xs font-mono tracking-wider uppercase border rounded-md font-semibold ${colorClass}`}>
      {level} Risk
    </span>
  );
};

export const RoleBadge: React.FC<{ role: string | undefined }> = ({ role }) => {
  if (!role) return null;
  
  let colorClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  if (role === 'Super Admin') {
    colorClass = 'bg-purple-500/10 text-purple-400 border-purple-500/20 font-bold';
  } else if (role === 'Admin') {
    colorClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  } else if (role === 'Auditor') {
    colorClass = 'bg-teal-500/10 text-[#10B981] border-teal-500/20';
  } else if (role === 'Contractor' || role === 'Vendor') {
    colorClass = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  }

  return (
    <span className={`px-2.5 py-1 text-xs font-mono tracking-wider uppercase border rounded-md font-semibold ${colorClass}`}>
      {role}
    </span>
  );
};

export const SecurityHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({
  title,
  subtitle,
  action,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-sans font-bold tracking-tight text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#00D4FF]" />
          {title}
        </h1>
        {subtitle && <p className="text-sm text-gray-400 mt-1 font-sans">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
};

export const ErrorCard: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => {
  return (
    <div className="bg-[#111827] border border-red-500/20 rounded-xl p-8 text-center max-w-lg mx-auto">
      <AlertTriangle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
      <h3 className="text-lg font-sans font-semibold text-white mb-2">Connection Exception</h3>
      <p className="text-sm text-gray-400 mb-6 font-mono leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-red-500/30 text-white rounded-lg text-sm font-mono tracking-wide transition-all"
        >
          Re-establish Connection
        </button>
      )}
    </div>
  );
};
