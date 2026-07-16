import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ShieldX, Bug, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0E17] text-white flex flex-col justify-center items-center p-6 text-center font-sans relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
      <div className="w-full max-w-md space-y-6 border border-gray-800 rounded-2xl bg-[#111827] p-8 shadow-2xl relative">
        <div className="inline-flex p-4 bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[#00D4FF] rounded-full">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-mono font-extrabold text-white">404</h1>
          <p className="text-xs font-mono text-[#00D4FF] uppercase tracking-widest font-semibold">
            SECURE_TARGET_NOT_FOUND
          </p>
        </div>
        <p className="text-sm text-gray-400 font-sans leading-relaxed">
          The node address you requested does not exist or has been cryptographically purged from the security routing directories.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full mt-4 py-2.5 bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-300 hover:text-white rounded-lg text-xs font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Command Center</span>
        </button>
      </div>
    </div>
  );
};

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0E17] text-white flex flex-col justify-center items-center p-6 text-center font-sans relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ef4444_1px,transparent_1px),linear-gradient(to_bottom,#ef4444_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-5 pointer-events-none" />
      <div className="w-full max-w-md space-y-6 border border-red-500/20 rounded-2xl bg-[#111827] p-8 shadow-2xl relative">
        <div className="inline-flex p-4 bg-red-500/10 border border-red-500/20 text-[#EF4444] rounded-full">
          <ShieldX className="w-12 h-12 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-mono font-extrabold text-red-500">403</h1>
          <p className="text-xs font-mono text-[#EF4444] uppercase tracking-widest font-semibold">
            ACCESS_DENIED_EXPLOIT_PREVENTED
          </p>
        </div>
        <p className="text-sm text-gray-400 font-sans leading-relaxed">
          Biometric clearance validation failure. Your security token signature does not possess the credentials needed to access this terminal node.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full mt-4 py-2.5 bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-300 hover:text-white rounded-lg text-xs font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Command Center</span>
        </button>
      </div>
    </div>
  );
};

export const ServerError: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0E17] text-white flex flex-col justify-center items-center p-6 text-center font-sans relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
      <div className="w-full max-w-md space-y-6 border border-gray-800 rounded-2xl bg-[#111827] p-8 shadow-2xl relative">
        <div className="inline-flex p-4 bg-amber-500/10 border border-amber-500/20 text-[#F59E0B] rounded-full">
          <Bug className="w-12 h-12 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-mono font-extrabold text-[#F59E0B]">500</h1>
          <p className="text-xs font-mono text-[#F59E0B] uppercase tracking-widest font-semibold">
            CORE_TRANSCRYPT_EXCEPTION
          </p>
        </div>
        <p className="text-sm text-gray-400 font-sans leading-relaxed">
          Internal database execution failure or service timeout. SecureCoreAI kernel was forced to restart the current socket stream.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full mt-4 py-2.5 bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-300 hover:text-white rounded-lg text-xs font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Attempt Re-handshake</span>
        </button>
      </div>
    </div>
  );
};
