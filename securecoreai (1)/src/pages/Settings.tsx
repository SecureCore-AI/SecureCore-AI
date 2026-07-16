import React, { useState } from 'react';
import { SecurityHeader } from '../components/CommonUI';
import { Settings as SettingsIcon, ShieldCheck, ToggleLeft, ToggleRight, Eye, RefreshCw, Lock, Radio } from 'lucide-react';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const [sessionTimeout, setSessionTimeout] = useState('15');
  const [twoFactor, setTwoFactor] = useState(true);
  const [anomalyDetection, setAnomalyDetection] = useState(true);
  const [alertTone, setAlertTone] = useState(false);
  const [debugStream, setDebugStream] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Security settings policy saved and pushed to local context.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <SecurityHeader
        title="Terminal Settings & Policies"
        subtitle="Manage local terminal security, session variables, and telemetry settings"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* left column form policies */}
        <form onSubmit={handleSave} className="md:col-span-2 bg-[#111827] border border-gray-800 rounded-2xl p-6 relative space-y-6">
          <div className="absolute top-0 inset-x-0 h-1 bg-[#00D4FF]" />

          <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400 pb-3 border-b border-gray-800/60 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-[#00D4FF]" />
            Local Console Configuration
          </h3>

          <div className="space-y-4">
            {/* 2FA Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-gray-950/40 border border-gray-850 rounded-xl">
              <div>
                <p className="text-xs font-mono font-bold text-white">MFA Force Validation</p>
                <p className="text-[11px] text-gray-500 font-sans mt-0.5">Force Step-Up challenges for high-risk actions</p>
              </div>
              <button
                type="button"
                onClick={() => setTwoFactor(!twoFactor)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {twoFactor ? (
                  <ToggleRight className="w-9 h-9 text-[#00D4FF]" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-gray-600" />
                )}
              </button>
            </div>

            {/* Anomaly detection Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-gray-950/40 border border-gray-850 rounded-xl">
              <div>
                <p className="text-xs font-mono font-bold text-white">Automated Lockout Protocols</p>
                <p className="text-[11px] text-gray-500 font-sans mt-0.5">Lock accounts automatically when risk rating exceeding 80 points</p>
              </div>
              <button
                type="button"
                onClick={() => setAnomalyDetection(!anomalyDetection)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {anomalyDetection ? (
                  <ToggleRight className="w-9 h-9 text-[#00D4FF]" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-gray-600" />
                )}
              </button>
            </div>

            {/* Alert tones */}
            <div className="flex items-center justify-between p-3.5 bg-gray-950/40 border border-gray-850 rounded-xl">
              <div>
                <p className="text-xs font-mono font-bold text-white">Audio Warning Synthesizer</p>
                <p className="text-[11px] text-gray-500 font-sans mt-0.5">Synthesize frequency hum alerts on threat detections</p>
              </div>
              <button
                type="button"
                onClick={() => setAlertTone(!alertTone)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {alertTone ? (
                  <ToggleRight className="w-9 h-9 text-[#00D4FF]" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-gray-600" />
                )}
              </button>
            </div>

            {/* Debug telemetry */}
            <div className="flex items-center justify-between p-3.5 bg-gray-950/40 border border-gray-850 rounded-xl">
              <div>
                <p className="text-xs font-mono font-bold text-white">Verbose Terminal Logs</p>
                <p className="text-[11px] text-gray-500 font-sans mt-0.5">Stream granular HTTP responses directly into console panel</p>
              </div>
              <button
                type="button"
                onClick={() => setDebugStream(!debugStream)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {debugStream ? (
                  <ToggleRight className="w-9 h-9 text-[#00D4FF]" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-gray-600" />
                )}
              </button>
            </div>

            {/* Timeout Selection */}
            <div className="p-3.5 bg-gray-950/40 border border-gray-850 rounded-xl space-y-2">
              <label className="block text-xs font-mono font-bold text-white">
                Bearer Token TTL Expiry (Minutes)
              </label>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#00D4FF] font-mono"
              >
                <option value="5">5 Minutes (Hyper Secure)</option>
                <option value="15">15 Minutes (Standard Policy)</option>
                <option value="60">60 Minutes (Debug Session Mode)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#00D4FF] hover:bg-[#00c2eb] active:scale-[0.99] text-black font-semibold rounded-lg text-sm font-mono tracking-wider transition-all cursor-pointer"
          >
            Deploy Settings Policy
          </button>
        </form>

        {/* policy overview card */}
        <div className="space-y-6">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-widest text-[#00D4FF] pb-2 border-b border-gray-800/60 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-[#00D4FF]" />
              System Status Feed
            </h3>
            <div className="space-y-3 font-mono text-[11px] text-gray-400 leading-normal">
              <p className="flex justify-between">
                <span>Kernel Node:</span>
                <span className="text-[#10B981]">ONLINE</span>
              </p>
              <p className="flex justify-between">
                <span>Audit Stream:</span>
                <span className="text-[#10B981]">SYNCHRONIZED</span>
              </p>
              <p className="flex justify-between">
                <span>FastAPI Host:</span>
                <span className="text-gray-300">127.0.0.1:8000</span>
              </p>
              <p className="flex justify-between">
                <span>Policy Version:</span>
                <span className="text-[#00D4FF]">SECURE-CORE-v2.4</span>
              </p>
            </div>
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-emerald-500/10 text-[#10B981] border border-emerald-500/20 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Secure TLS Tunnel
            </p>
            <p className="text-[11px] text-gray-500 font-sans leading-relaxed">
              All REST API calls directed towards http://127.0.0.1:8000 are secured in the browser scope.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
