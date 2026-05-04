
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings, Database, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { signOut } from 'next-auth/react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Agents', href: '/agents', icon: Users },
    { label: 'Repository', href: '/repository', icon: Database },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-screen bg-brand-navy text-white flex flex-col fixed left-0 top-0 border-r border-brand-deepBlue/50">
      <div className="p-6 flex items-center gap-3 border-b border-brand-deepBlue/50">
        <div className="w-8 h-8 bg-brand-teal rounded-lg flex items-center justify-center font-bold">W</div>
        <span className="font-bold text-lg tracking-wide">WORKMIND<span className="text-brand-lightTeal">.AI</span></span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
                isActive ? "bg-brand-teal text-white shadow-lg" : "text-gray-300 hover:bg-brand-deepBlue hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-brand-deepBlue/50">
        <button 
          onClick={() => signOut()} 
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-white hover:bg-brand-deepBlue rounded-lg transition-all text-sm"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
