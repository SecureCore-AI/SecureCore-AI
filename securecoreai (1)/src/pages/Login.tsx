import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, User, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please supply all required authentication fields.');
      return;
    }

    const success = await login(username.trim(), password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] text-white flex flex-col justify-center items-center p-4 relative font-sans overflow-hidden">
      {/* Visual cyber mesh grid backgrounds */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      
      {/* Top ambient color spot */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[#00D4FF]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-8 animate-in fade-in slide-in-from-top-6 duration-300">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-gray-900/80 border border-gray-800 rounded-2xl mb-4 shadow-[0_0_30px_rgba(0,212,255,0.05)]">
            <ShieldCheck className="w-12 h-12 text-[#00D4FF]" />
          </div>
          <h1 className="text-3xl font-sans font-extrabold tracking-tight text-white">
            Secure<span className="text-[#00D4FF]">Core</span>AI
          </h1>
          <p className="text-xs text-gray-400 mt-2 font-mono uppercase tracking-widest leading-relaxed">
            Privileged Access & Insider Threat Shield
          </p>
        </div>

        <div className="bg-[#111827] border border-gray-800/80 rounded-2xl shadow-2xl p-8 relative">
          <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/40 to-transparent" />
          
          <h2 className="text-lg font-sans font-bold text-white mb-6 border-b border-gray-800 pb-3 flex items-center gap-2">
            <span className="w-1.5 h-3 bg-[#00D4FF] rounded-sm" />
            Operator Terminal Authorization
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-mono text-red-400">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2" htmlFor="username">
                Username / Terminal ID
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="username"
                  type="text"
                  required
                  placeholder="e.g. jsmith"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-all font-mono"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2" htmlFor="password">
                Security Key / Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-all font-mono"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#00D4FF] hover:bg-[#00c2eb] active:scale-[0.99] disabled:opacity-50 text-black font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Integrity...</span>
                </>
              ) : (
                <span>Establish Secure Link</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-800/80 text-center">
            <p className="text-xs text-gray-400 font-sans">
              Need access?{' '}
              <Link to="/register" className="text-[#00D4FF] hover:underline font-semibold font-mono">
                Register Operator
              </Link>
            </p>
          </div>
        </div>

        <p className="text-[10px] text-center font-mono text-gray-500 leading-normal">
          WARNING: Uncontrolled access is recorded. Authorized operations only.<br />
          System: 127.0.0.1:8000 SecureCoreAI Framework.
        </p>
      </div>
    </div>
  );
};
