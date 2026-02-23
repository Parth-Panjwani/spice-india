'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, GraduationCap, Package, Send, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useAuth } from '@/contexts/AuthContext';

const tabs = [
  { name: 'Home', href: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'cook'] },
  { name: 'Contracts', href: '/students', icon: GraduationCap, roles: ['admin'] },
  { name: 'Sent ₽', href: '/remittances', icon: Send, roles: ['admin', 'manager'] },
  { name: 'Kitchen', href: '/inventory', icon: Package, roles: ['admin', 'manager', 'cook'] },
  { name: 'Staff', href: '/staff', icon: Users, roles: ['admin', 'cook'] },
];

export function BottomNavBar() {
  const pathname = usePathname();
  const { role } = useAuth();

  const filteredTabs = tabs.filter(tab => {
    if (!role) return false;
    return tab.roles.includes(role);
  });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {filteredTabs.map((tab) => {
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
