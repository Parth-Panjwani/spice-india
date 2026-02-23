import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { Sidebar } from "@/components/Sidebar";
import { BottomNavBar } from "@/components/BottomNavBar";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SpiceIndia Manager",
  description: "Manage expenses, income, and student IDs for SpiceIndia mess",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SpiceIndia",
  },
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <AuthProvider>
          <div className="flex min-h-screen">
            {/* Desktop Sidebar - Hidden on Mobile */}
            <div className="hidden md:block h-screen sticky top-0 w-64 flex-shrink-0 border-r border-gray-100 bg-white shadow-sm z-10">
              <Sidebar />
            </div>

            {/* Main Content - Add bottom padding on mobile for nav bar */}
            <main className="flex-1 min-w-0 flex flex-col min-h-screen pb-20 md:pb-0">
              <div className="w-full p-4 md:p-8 max-w-7xl mx-auto">
                {children}
              </div>
            </main>

            {/* Bottom Navigation - Mobile Only */}
            <BottomNavBar />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
