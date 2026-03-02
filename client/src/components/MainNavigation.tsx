
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Home,
  MessageCircle,
  Activity,
  Sparkles,
  User,
  Settings,
  Moon,
  ShieldAlert,
  Users,
  LogOut,
  ChevronDown,
  Heart,
  MessageSquare
} from 'lucide-react';
import Logo from './Logo';
import { FeedbackModal } from '@/components/FeedbackModal';

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
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const isActive = (href: string) => location === href;

  // Fetch logged-in user info
  useEffect(() => {
    fetch('/api/auth/user', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setUser(data); })
      .catch(() => { });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { }
    // Redirect to login page regardless
    window.location.href = '/login';
  };

  const displayName = user
    ? (user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username || user.email || 'My Account')
    : 'My Account';

  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'World', href: '/community', icon: Users },
    { name: 'Women', href: '/women', icon: Heart, accent: true },
  ];

  return (
    <>
      {/* Desktop Navigation - Ethereal Glass Sidebar */}
      <nav className="hidden lg:flex fixed left-8 top-8 bottom-8 w-64 glass-panel flex-col py-8 z-50 shadow-2xl shadow-indigo-100/50 transition-all duration-500">

        {/* Logo Area */}
        <div className="mb-10 px-4">
          <Logo size="sm" showText={true} />
        </div>

        {/* Nav Items */}
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

        {/* Bottom Actions */}
        <div className="mt-auto px-4 w-full space-y-4">
          <Link href="/sos">
            <div className={`flex items-center gap-4 px-4 py-3 rounded-[1.5rem] cursor-pointer transition-all duration-300 ${isActive('/sos') ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'bg-rose-50/50 text-rose-500 hover:bg-rose-100'}`}>
              <ShieldAlert className="w-5 h-5 font-bold" />
              <span className="font-semibold tracking-wide">SOS Panic Button</span>
            </div>
          </Link>

          <div
            className={`flex items-center gap-4 px-4 py-3 rounded-[1.5rem] cursor-pointer transition-all duration-300 ${feedbackOpen ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:bg-white/40 hover:text-slate-600'}`}
            onClick={() => setFeedbackOpen(true)}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Provide Feedback</span>
          </div>

          <Link href="/settings">
            <div className={`flex items-center gap-4 px-4 py-3 rounded-[1.5rem] cursor-pointer transition-all duration-300 ${isActive('/settings') ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:bg-white/40 hover:text-slate-600'}`}>
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </div>
          </Link>

          {/* User Profile with Log Out */}
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

            {/* Dropdown Menu */}
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
      </nav >

      {/* Mobile Navigation - Glass Bar */}
      < nav className="fixed bottom-6 left-6 right-6 lg:hidden glass-panel px-6 py-4 flex justify-between items-center z-50 shadow-2xl shadow-indigo-100/50" >
        {
          navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-indigo-600 -translate-y-1' : 'text-slate-400'
                  }`}>
                  <div className={`p-2 rounded-full transition-all ${active ? 'bg-indigo-50 shadow-sm' : ''}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  {active && <span className="text-[10px] font-bold tracking-wide">{item.name}</span>}
                </div>
              </Link>
            );
          })
        }
        < Link href="/sos" >
          <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive('/sos') ? 'text-rose-500 -translate-y-1' : 'text-rose-400/70'}`}>
            <div className={`p-2 rounded-full transition-all ${isActive('/sos') ? 'bg-rose-50 shadow-sm' : 'bg-rose-50/50'}`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            {isActive('/sos') && <span className="text-[10px] font-bold tracking-wide">SOS</span>}
          </div>
        </Link >

        {/* Feedback Icon in Mobile Nav */}
        < div
          className={`flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer ${feedbackOpen ? 'text-indigo-600 -translate-y-1' : 'text-slate-400'}`
          }
          onClick={() => setFeedbackOpen(true)}
        >
          <div className={`p-2 rounded-full transition-all ${feedbackOpen ? 'bg-indigo-50 shadow-sm' : ''}`}>
            <MessageSquare className="w-6 h-6" />
          </div>
          {feedbackOpen && <span className="text-[10px] font-bold tracking-wide">Feedback</span>}
        </div >

        {/* Mobile logout via profile icon */}
        < div className="relative" >
          <div
            className={`flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer ${isActive('/settings') ? 'text-indigo-600 -translate-y-1' : 'text-slate-400'}`}
            onClick={() => setShowUserMenu(v => !v)}
          >
            <div className={`p-2 rounded-full transition-all ${isActive('/settings') ? 'bg-indigo-50 shadow-sm' : ''}`}>
              <User className="w-6 h-6" />
            </div>
            {isActive('/settings') && <span className="text-[10px] font-bold tracking-wide">Me</span>}
          </div>

          {
            showUserMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-10">
                <Link href="/settings">
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 cursor-pointer text-slate-700" onClick={() => setShowUserMenu(false)}>
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-medium">Settings</span>
                  </div>
                </Link>
                <div className="border-t border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 cursor-pointer text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Log Out</span>
                </button>
              </div>
            )
          }
        </div >
      </nav >

      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
