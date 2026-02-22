'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, GraduationCap, IndianRupee, Send, Package, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Meal Contracts', href: '/students', icon: GraduationCap },
  { name: 'Income Logs', href: '/income', icon: IndianRupee },
  { name: 'Remittances', href: '/remittances', icon: Send },
  { name: 'Inventory & Kitchen', href: '/inventory', icon: Package },
  { name: 'Staff Wages', href: '/staff', icon: Users },
  { name: 'Basic Expenses', href: '/expenses', icon: Wallet },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate, ...props }: SidebarProps) {
  const pathname = usePathname();

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
        {navigation.map((item) => {
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
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-center text-xs text-gray-400">
          SpiceIndia Manager v1.0
        </p>
      </div>
    </div>
  );
}
