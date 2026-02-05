'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="md:hidden sticky top-0 z-50 glass border-b border-gray-200/50 shadow-sm">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Menu Button */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors rounded-xl"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r w-72 bg-white">
            <Sidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        
        {/* Centered Logo */}
        <div className="absolute left-1/2 -translate-x-1/2"> 
          <div className="relative h-8 w-28">
            <Image 
              src="/SpiceIndia_Logo.png" 
              alt="SpiceIndia" 
              fill 
              className="object-contain" 
              priority
            />
          </div>
        </div>

        {/* Right Spacer for balance */}
        <div className="w-9" />
      </div>
    </header>
  );
}
