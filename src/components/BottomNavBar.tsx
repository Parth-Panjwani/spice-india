'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, GraduationCap, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Expenses', href: '/expenses', icon: Wallet },
  { name: 'Students', href: '/students', icon: GraduationCap },
  { name: 'Income', href: '/income', icon: IndianRupee },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
          
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 px-1 min-h-[56px] transition-all duration-200 active:scale-95',
                isActive 
                  ? 'text-orange-600' 
                  : 'text-gray-500 active:text-orange-500'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200',
                isActive && 'bg-orange-100'
              )}>
                <tab.icon className={cn(
                  'h-5 w-5 transition-all',
                  isActive ? 'text-orange-600' : 'text-gray-500'
                )} />
              </div>
              <span className={cn(
                'text-[10px] font-medium mt-0.5 transition-colors',
                isActive ? 'text-orange-600' : 'text-gray-500'
              )}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
