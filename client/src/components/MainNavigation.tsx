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
    </>
  );
}
