import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Users,
  Heart,
  Zap,
  ShieldAlert,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Compass,
  X
} from 'lucide-react';
import Logo from './Logo';
import { usePhase } from '@/context/PhaseContext';

interface UserProfile {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export default function MainNavigation() {
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => location === href;

  // Fetch logged-in user info
  useEffect(() => {
    fetch('/api/auth/user', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUser(data); })
      .catch(() => { });
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowUserMenu(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { }
    window.location.href = '/login';
  };

  const displayName = user
    ? (user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username || user.email || 'My Account')
    : 'My Account';

  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const { gender } = usePhase();

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'World', href: '/community', icon: Users },
    ...(gender === 'male'
      ? [{ name: 'Hub', href: '/men', icon: Zap }]
      : [{ name: 'Women', href: '/women', icon: Heart }]),
  ];

  const mobileItems = [
    ...navItems,
    { name: 'Settings', href: '/settings', icon: User },
    { name: 'SOS', href: '/sos', icon: ShieldAlert }
  ];

  return (
    <>
      {/* ── DESKTOP NAVIGATION ── */}
      <nav className="hidden lg:flex fixed left-8 top-8 bottom-8 w-64 glass-panel flex-col py-8 z-50 shadow-2xl shadow-indigo-100/50 transition-all duration-500">
        <div className="mb-10 px-4">
          <Logo size="sm" showText={true} />
        </div>
        <div className="flex-1 w-full px-4 space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center gap-4 px-4 py-3.5 rounded-[1.5rem] cursor-pointer transition-all duration-300 relative group ${active
                  ? 'bg-white shadow-md shadow-indigo-100/50 text-indigo-600'
                  : 'text-slate-500 hover:bg-white/40 hover:text-slate-800'
                  }`}>
                  <item.icon className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className={`font-medium transition-colors duration-300 ${active ? 'text-indigo-600' : 'text-slate-600'}`}>
                    {item.name}
                  </span>
                  {active && (
                    <div className="absolute inset-0 bg-indigo-50 rounded-[1.5rem] -z-10 blur-sm opacity-50"></div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-auto px-4 w-full space-y-4">
          <Link href="/sos">
            <div className={`flex items-center gap-4 px-4 py-3 rounded-[1.5rem] cursor-pointer transition-all duration-300 ${isActive('/sos') ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'bg-rose-50/50 text-rose-500 hover:bg-rose-100'}`}>
              <ShieldAlert className="w-5 h-5 font-bold" />
              <span className="font-semibold tracking-wide">SOS Panic Button</span>
            </div>
          </Link>
          <Link href="/settings">
            <div className={`flex items-center gap-4 px-4 py-3 rounded-[1.5rem] cursor-pointer transition-all duration-300 ${isActive('/settings') ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:bg-white/40 hover:text-slate-600'}`}>
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </div>
          </Link>

          <div className="mx-0 pt-4 border-t border-white/40 relative">
            <div
              className="flex items-center gap-3 cursor-pointer group px-2 py-2 rounded-2xl hover:bg-white/40 transition-all"
              onClick={() => setShowUserMenu(v => !v)}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-400 to-pink-300 flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0">
                {initials}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors truncate">{displayName}</span>
                <span className="text-xs text-slate-400 truncate">{user?.email || ''}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </div>
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-10">
                <Link href="/settings">
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 cursor-pointer text-slate-700 hover:text-indigo-600 transition-colors" onClick={() => setShowUserMenu(false)}>
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Profile & Settings</span>
                  </div>
                </Link>
                <div className="border-t border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 cursor-pointer text-red-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── MOBILE RADIAL FAB NAVIGATION (Minimal Compass) ── */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden" ref={menuRef}>

        {/* The Radial Menu Items */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-0 right-0 w-[300px] h-[300px] pointer-events-none"
            >
              {mobileItems.map((item, index) => {
                // Determine layout: distribute across a 90-degree arc
                const angle = (Math.PI / 2) * (index / (mobileItems.length - 1));
                const radius = 110; // Expansion range
                // x goes left (negative), y goes up (negative)
                const x = -Math.round(radius * Math.cos(angle));
                const y = -Math.round(radius * Math.sin(angle));

                const active = isActive(item.href);
                let activeStyle = 'bg-indigo-500 text-white border-indigo-400 shadow-indigo-500/30';
                let inactiveStyle = 'bg-white/90 text-slate-600 border-slate-200 hover:bg-white shadow-slate-900/10';

                if (item.name === 'SOS') {
                  activeStyle = 'bg-rose-500 text-white border-rose-400 shadow-rose-500/30';
                  inactiveStyle = 'bg-rose-50/90 text-rose-500 border-rose-100 hover:bg-rose-100 shadow-rose-500/10';
                }

                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                    animate={{ opacity: 1, x, y, scale: 1 }}
                    exit={{ opacity: 0, x: 0, y: 0, scale: 0.3 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 18,
                      delay: index * 0.04
                    }}
                    className="absolute bottom-1 right-1 pointer-events-auto"
                  >
                    <Link href={item.href}>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md border border-[0.5px] cursor-pointer group hover:scale-110 transition-transform ${active ? activeStyle : inactiveStyle
                          }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <item.icon className={`w-5 h-5 ${active ? '' : 'opacity-80 group-hover:opacity-100'}`} />

                        {/* Interactive Label Tooltip */}
                        <div className="absolute top-14 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 bg-white px-2 py-0.5 rounded-full shadow-sm drop-shadow-sm">{item.name}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Main Trigger Orb */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${mobileMenuOpen
              ? 'bg-slate-800 text-white shadow-slate-900/40 rotate-180'
              : 'bg-gradient-to-tr from-indigo-500 to-rose-500 text-white shadow-indigo-500/40'
            }`}
        >
          <motion.div
            initial={false}
            animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Compass className="w-6 h-6" />}
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
