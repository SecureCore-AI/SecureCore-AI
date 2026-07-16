import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  LayoutDashboard,
  User as UserIcon,
  Zap,
  FileCode,
  AlertOctagon,
  Lock,
  Database,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Menu,
  X,
  ShieldAlert
} from 'lucide-react';
import { RoleBadge, RiskBadge } from '../components/CommonUI';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  allowedRoles: string[];
}

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  if (!user) return null;

  const sidebarItems: SidebarItem[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['Employee', 'Contractor', 'Vendor', 'Admin', 'Auditor', 'Super Admin'],
    },
    {
      name: 'My Profile',
      path: '/profile',
      icon: UserIcon,
      allowedRoles: ['Employee', 'Contractor', 'Vendor', 'Admin', 'Auditor', 'Super Admin'],
    },
    {
      name: 'Perform Action',
      path: '/action',
      icon: Zap,
      allowedRoles: ['Employee', 'Contractor', 'Vendor', 'Admin', 'Super Admin'],
    },
    {
      name: 'Audit Logs',
      path: '/logs',
      icon: FileCode,
      allowedRoles: ['Admin', 'Auditor', 'Super Admin'],
    },
    {
      name: 'Alerts',
      path: '/alerts',
      icon: AlertOctagon,
      allowedRoles: ['Admin', 'Auditor', 'Super Admin'],
    },
    {
      name: 'Locked Accounts',
      path: '/locked-accounts',
      icon: Lock,
      allowedRoles: ['Super Admin'],
    },
    {
      name: 'Audit Integrity',
      path: '/integrity',
      icon: Database,
      allowedRoles: ['Admin', 'Auditor', 'Super Admin'],
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: SettingsIcon,
      allowedRoles: ['Employee', 'Contractor', 'Vendor', 'Admin', 'Auditor', 'Super Admin'],
    },
  ];

  // Filter items based on user role
  const allowedItems = sidebarItems.filter((item) =>
    item.allowedRoles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Mock notifications for cybersecurity environment
  const mockNotifications = [
    { id: 1, title: 'High Risk Action Blocked', desc: 'Vendor attempted DELETE_RECORD on production db.', time: '5m ago', unread: true },
    { id: 2, title: 'Department Anomaly Detected', desc: 'Employee login from uncommon IP address range.', time: '2h ago', unread: true },
    { id: 3, title: 'System Security Check Complete', desc: 'Audit log integrity chain verified intact.', time: '4h ago', unread: false },
  ];

  return (
    <div className="h-screen bg-[#0A0E17] text-gray-100 flex flex-col font-sans overflow-hidden select-none">
      {/* Top Navbar */}
      <header className="bg-[#0A0E17] border-b border-gray-800 px-4 lg:px-8 h-16 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-gray-400 hover:text-white p-1 rounded-md"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <ShieldCheck className="w-8 h-8 text-[#00D4FF]" />
            <div className="flex flex-col">
              <span className="font-sans font-extrabold text-lg tracking-wider text-white uppercase">
                SecureCore<span className="text-[#00D4FF]">AI</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#00D4FF]/70 uppercase hidden sm:inline">
                Access Shield v2.4
              </span>
            </div>
          </div>
          <div className="hidden md:block h-4 w-px bg-gray-800 mx-2"></div>
          <span className="hidden md:inline text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            System: Operational
          </span>
        </div>

        {/* User Info Bar */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-sans font-bold text-white">{user.username}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-mono bg-blue-900/40 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800">
                {user.role.toUpperCase()}
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${(user.risk_level || "Low") === "High"
                  ? "bg-red-950/40 text-red-400 border-red-900"
                  : (user.risk_level || "Low") === "Medium"
                    ? "bg-amber-950/40 text-amber-400 border-amber-900"
                    : "bg-emerald-950/40 text-emerald-400 border-emerald-900"
                  }`}
              >
                RISK: {(user.risk_level || "Low").toUpperCase()}

              </span>
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00D4FF] to-blue-600 flex items-center justify-center text-white font-extrabold text-sm uppercase shadow-[0_0_15px_rgba(0,212,255,0.2)]">
            {user.username.slice(0, 2)}
          </div>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg relative transition-all"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-[#111827] border border-gray-800 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-3">
                    <h3 className="font-sans font-bold text-sm flex items-center gap-1.5 text-[#00D4FF]">
                      <ShieldAlert className="w-4 h-4" />
                      Security Warnings
                    </h3>
                    <span className="text-xs font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">
                      2 NEW
                    </span>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {mockNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-lg border text-xs leading-relaxed transition-all ${notif.unread
                          ? 'bg-[#00D4FF]/5 border-[#00D4FF]/20 hover:bg-[#00D4FF]/10'
                          : 'bg-transparent border-gray-800/40 opacity-70 hover:bg-gray-800/20'
                          }`}
                      >
                        <div className="flex justify-between font-semibold text-white mb-1">
                          <span>{notif.title}</span>
                          <span className="text-[10px] font-mono text-gray-400">{notif.time}</span>
                        </div>
                        <p className="text-gray-400 font-mono text-[11px]">{notif.desc}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      navigate('/alerts');
                    }}
                    className="w-full text-center text-xs font-mono text-[#00D4FF] hover:underline border-t border-gray-800/60 pt-2 mt-3 block"
                  >
                    View All Active Incidents
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-950/60 border border-red-900/40 hover:border-red-900 text-red-400 rounded-lg text-xs font-mono tracking-wider uppercase transition-all"
            title="Disconnect Terminal"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Disconnect</span>
          </button>
        </div>
      </header >

      {/* Main Container */}
      < div className="flex flex-1 relative overflow-hidden" >
        {/* Left Sidebar - Desktop */}
        < aside className="hidden lg:flex flex-col w-64 bg-[#0F172A] border-r border-gray-800 p-4 flex-shrink-0" >
          <div className="mb-4 px-2">
            <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">
              Security Operations
            </span>
          </div>

          <nav className="flex-1 space-y-1">
            {allowedItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium tracking-wide transition-all border ${isActive
                      ? 'bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20 font-bold'
                      : 'text-gray-400 border-transparent hover:text-gray-100 hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-2 border-t border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer" onClick={handleLogout}>
              <LogOut className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium">Logout Terminal</span>
            </div>
          </div>
        </aside >

        {/* Mobile Navigation Drawer */}
        {
          isMobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <aside className="fixed top-16 left-0 bottom-0 w-64 bg-[#0F172A] border-r border-gray-800 p-6 z-30 lg:hidden flex flex-col animate-in slide-in-from-left duration-200">
                <div className="flex flex-col mb-4 bg-[#111827] p-3 rounded-lg border border-gray-800">
                  <span className="text-sm font-bold text-white mb-0.5">{user.username}</span>
                  <span className="text-xs font-mono text-gray-400 mb-2">Dept: {user.department}</span>
                  <div className="flex flex-wrap gap-1.5">
                    <RoleBadge role={user.role} />
                    <RiskBadge level={user.risk_level} />
                  </div>
                </div>

                <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-4 block">
                  Security Operations
                </span>

                <nav className="flex-1 space-y-1 overflow-y-auto">
                  {allowedItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium tracking-wide transition-all border ${isActive
                            ? 'bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/20 font-bold'
                            : 'text-gray-400 border-transparent hover:text-gray-100 hover:bg-gray-800'
                          }`
                        }
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {item.name}
                      </NavLink>
                    );
                  })}
                </nav>

                <div className="pt-6 border-t border-gray-800 text-center">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-red-950/40 hover:bg-red-950/60 border border-red-900/40 text-red-400 rounded-lg text-xs font-mono tracking-wider uppercase transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect
                  </button>
                </div>
              </aside>
            </>
          )
        }

        {/* Content & Footer wrapper */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Scrollable Content Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto">
            <Outlet />
          </main>

          {/* Footer Info Bar */}
          <footer className="bg-[#0F172A] border-t border-gray-800 px-6 py-2.5 flex justify-between items-center text-[10px] text-gray-500 flex-shrink-0">
            <div className="flex items-center gap-6">
              <span>API STATUS: <span className="text-emerald-500 font-bold">CONNECTED</span></span>
              <span>DB CLUSTER: <span className="text-emerald-500 font-bold">OPTIMAL</span></span>
              <span className="hidden sm:inline">TUNNEL: <span className="text-[#00D4FF] font-mono">TLS_AES_256_GCM_SHA384</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-mono tracking-wide uppercase">ENCRYPTED END-TO-END SESSION</span>
            </div>
          </footer>
        </div>
      </div >
    </div >
  );
};

