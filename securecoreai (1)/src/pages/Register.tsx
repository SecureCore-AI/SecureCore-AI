import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Mail, Lock, Building, Layers } from 'lucide-react';
import { UserRole } from '../types';

export const Register: React.FC = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Employee');
  const [department, setDepartment] = useState('Engineering');
  const [errorMsg, setErrorMsg] = useState('');

  const roles: UserRole[] = ['Employee', 'Contractor', 'Vendor', 'Admin', 'Auditor', 'Super Admin'];
  const departments = ['Engineering', 'Operations', 'Executive', 'Finance', 'HR', 'Security'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please complete all credential parameters.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Key strength error. Password must be at least 6 characters.');
      return;
    }

    const success = await register(
      username.trim(),
      email.trim(),
      password,
      role,
      department
    );

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

      <div className="w-full max-w-lg relative z-10 space-y-6 my-8 animate-in fade-in slide-in-from-top-6 duration-300">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-2.5 bg-gray-900/80 border border-gray-800 rounded-2xl mb-3 shadow-[0_0_30px_rgba(0,212,255,0.05)]">
            <ShieldCheck className="w-10 h-10 text-[#00D4FF]" />
          </div>
          <h1 className="text-2xl font-sans font-extrabold tracking-tight text-white">
            Secure<span className="text-[#00D4FF]">Core</span>AI
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-mono uppercase tracking-widest">
            Register Security Credentials
          </p>
        </div>

        <div className="bg-[#111827] border border-gray-800/80 rounded-2xl shadow-2xl p-8 relative">
          <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/40 to-transparent" />

          <h2 className="text-md font-sans font-bold text-white mb-6 border-b border-gray-800 pb-3 flex items-center gap-2">
            <span className="w-1.5 h-3 bg-[#00D4FF] rounded-sm" />
            Provision Operator Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-mono text-red-400">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5" htmlFor="username">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="username"
                    type="text"
                    required
                    placeholder="jsmith"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] transition-all font-mono"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="jsmith@secure.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] transition-all font-mono"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5" htmlFor="password">
                Key Phrase (Password)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] transition-all font-mono"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5" htmlFor="department">
                  Department
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <Building className="w-4 h-4" />
                  </span>
                  <select
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#00D4FF] transition-all font-mono appearance-none"
                    disabled={isLoading}
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1.5" htmlFor="role">
                  Requested Security Role
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <Layers className="w-4 h-4" />
                  </span>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-[#00D4FF] transition-all font-mono appearance-none"
                    disabled={isLoading}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-2.5 bg-[#00D4FF] hover:bg-[#00c2eb] active:scale-[0.99] disabled:opacity-50 text-black font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Enrolling Operator...</span>
                </>
              ) : (
                <span>Register Terminal</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-800/80 text-center">
            <p className="text-xs text-gray-400 font-sans">
              Already have credentials?{' '}
              <Link to="/login" className="text-[#00D4FF] hover:underline font-semibold font-mono">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};