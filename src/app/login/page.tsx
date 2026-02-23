'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(pin);
    if (success) {
      router.push('/');
    } else {
      setError('Invalid PIN code. Please try again.');
    }
    setLoading(false);
  };

  const handleNumpad = (num: string) => {
    if (pin.length < 10) setPin(prev => prev + num);
  };
  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
         <div className="h-16 w-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <span className="text-3xl font-black text-white shrink-0">₹</span>
         </div>
         <h1 className="text-3xl font-black text-gray-900 tracking-tight">SpiceIndia</h1>
         <p className="text-sm font-medium text-muted-foreground mt-1">Operations Control Center</p>
      </div>

      <Card className="w-full max-w-sm shadow-xl border-0 ring-1 ring-black/5">
         <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Enter Access PIN</CardTitle>
            <CardDescription>Use your assigned role PIN to continue.</CardDescription>
         </CardHeader>
         <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
               <div className="flex justify-center">
                  <div className="flex gap-3">
                     {[0, 1, 2, 3].map((_, i) => (
                       <div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${i < pin.length ? 'border-orange-600 bg-orange-600' : 'border-gray-300'}`} />
                     ))}
                  </div>
               </div>

               {error && <p className="text-sm text-red-600 text-center font-medium bg-red-50 py-2 rounded">{error}</p>}

               <div className="grid grid-cols-3 gap-3">
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                   <button key={num} type="button" onClick={() => handleNumpad(num.toString())} className="h-14 bg-gray-50 hover:bg-gray-100 rounded-xl text-xl font-bold text-gray-900 transition-colors active:bg-gray-200">
                     {num}
                   </button>
                 ))}
                 <button type="button" onClick={handleDelete} className="h-14 bg-gray-50 hover:bg-red-50 rounded-xl text-lg font-bold text-red-600 transition-colors active:bg-gray-200">
                   DEL
                 </button>
                 <button type="button" onClick={() => handleNumpad('0')} className="h-14 bg-gray-50 hover:bg-gray-100 rounded-xl text-xl font-bold text-gray-900 transition-colors active:bg-gray-200">
                   0
                 </button>
                 <Button type="submit" disabled={pin.length < 4 || loading} className="h-14 rounded-xl text-lg font-bold bg-orange-600 hover:bg-orange-700">
                   OK
                 </Button>
               </div>
            </form>
         </CardContent>
      </Card>
    </div>
  );
}
