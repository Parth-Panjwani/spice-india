'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, GraduationCap, IndianRupee, Send, Package, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'cook'] },
  { name: 'Meal Contracts', href: '/students', icon: GraduationCap, roles: ['admin', 'manager'] },
  { name: 'Income Logs', href: '/income', icon: IndianRupee, roles: ['admin'] },
  { name: 'Money Sent / Requests', href: '/remittances', icon: Send, roles: ['admin', 'manager'] },
  { name: 'Kitchen & Inventory', href: '/inventory', icon: Package, roles: ['admin', 'manager', 'cook'] },
  { name: 'Staff Wages', href: '/staff', icon: Users, roles: ['admin', 'manager', 'cook'] },
  { name: 'Basic Expenses', href: '/expenses', icon: Wallet, roles: ['admin', 'manager'] },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate, ...props }: SidebarProps) {
  const pathname = usePathname();
  const { role, logout } = useAuth();

  const filteredNavigation = navigation.filter(item => {
    if (!role) return false;
    return item.roles.includes(role);
  });

  return (
    <div className={cn("flex flex-col h-full bg-white", className)} {...props}>
      {/* Logo Section */}
      <div className="p-6 flex justify-center border-b border-gray-100">
        <div className="relative h-26 w-40">
          <Image 
            src="/SpiceIndia_Logo.png" 
            alt="SpiceIndia" 
            fill 
            className="object-contain" 
            priority
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                  : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400")} />
              {item.name === 'Staff Wages' && role === 'cook' ? 'My Pay' : item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 flex justify-between items-center">
        <p className="text-xs text-gray-400 font-medium">
          Logged in as: <span className="uppercase text-gray-700">{role}</span>
        </p>
        <button onClick={logout} className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-1 bg-red-50 rounded">Logout</button>
      </div>
    </div>
  );
}
