import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import Logo from './Logo';

export default function MainNavigation() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const isActive = (href: string) => location === href;

  // Auto-hide the invisible header when scrolling down on mobile
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false); // Scrolling down
      } else {
        setIsVisible(true); // Scrolling up
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { name: 'Home', href: '/dashboard' },
    { name: 'World', href: '/community' },
    { name: 'SOS', href: '/sos' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <>
      {/* ── DESKTOP NAVIGATION (Left Sidebar) ── */}
      <nav className="hidden lg:flex fixed left-8 top-8 bottom-8 w-64 glass-panel flex-col py-8 z-50 shadow-2xl shadow-indigo-100/50 transition-all duration-500">
        <div className="mb-10 px-4">
          <Logo size="sm" showText={true} />
        </div>
        <div className="flex-1 w-full px-4 space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.name} href={item.href}>
                <div className={`px-4 py-3 rounded-[1.5rem] cursor-pointer transition-all duration-300 ${active
                  ? 'bg-white shadow-md text-indigo-600'
                  : 'text-slate-500 hover:bg-white/40 hover:text-slate-800'
                  }`}>
                  <span className={`font-medium ${active ? 'font-bold text-indigo-600' : 'text-slate-600'}`}>
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── MOBILE "INVISIBLE" HEADER NAVIGATION ── */}
      {/* Eliminates bottom padding, radial compasses, and clutter by replacing them with a minimal text header */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 lg:hidden px-6 pt-6 pb-4 bg-gradient-to-b from-slate-950/90 to-transparent flex justify-between items-center transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
      >
        {/* Compact Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-rose-500 p-[1px]">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <span className="font-black text-white text-[10px]">P</span>
            </div>
          </div>
        </div>

        {/* Text-Only Subtle Links */}
        <div className="flex gap-4 items-center">
          {navItems.filter(i => i.name !== 'Home').map(item => (
            <Link key={item.name} href={item.href}>
              <span className={`text-[11px] uppercase tracking-widest font-bold cursor-pointer transition-colors ${isActive(item.href) ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
