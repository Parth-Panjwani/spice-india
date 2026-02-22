'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
// Badge removed as it is efficiently handled by custom styles
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search, FileDown, Trash2, UserCircle, MoreVertical, Pencil, RefreshCw, Archive, RotateCcw, Calendar, IndianRupee } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, addMonths, isPast } from 'date-fns';

export default function StudentManager({ initialStudents }: { initialStudents: any[] }) {
  const [students, setStudents] = useState(initialStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [renewingStudent, setRenewingStudent] = useState<any>(null);
  const [renewalFee, setRenewalFee] = useState('');
  const [rubalRate, setRubalRate] = useState('0.92');
  const [renewalMonths, setRenewalMonths] = useState(3);
  const [renewalMealType, setRenewalMealType] = useState('both');
  const router = useRouter();

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    // Show ALL students - no status filtering
    return matchesSearch;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student permanently?')) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStudents(prev => prev.filter(s => s._id !== id));
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete', error);
    }
  };

  const handleArchive = async (id: string, archive: boolean) => {
    try {
      const res = await fetch(`/api/students/${id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: archive ? 'archived' : 'active' })
      });
      if (res.ok) {
        setStudents(prev => prev.map(s => s._id === id ? { ...s, status: archive ? 'archived' : 'active' } : s));
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const openRenewalModal = (student: any) => {
    setRenewingStudent(student);
    setRenewalFee('');
    setRenewalMonths(3);
  };

  const handleRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingStudent) return;

    // Logic: Extend End Date from TODAY (if expired) or from existing End Date?
    // User usually wants to renew from today if it's long expired. 
    // Let's assume renewal starts from TODAY if expired, or extends existing if valid.
    
    let baseDate = new Date();
    if (renewingStudent.endDate && !isPast(new Date(renewingStudent.endDate))) {
       baseDate = new Date(renewingStudent.endDate);
    }
    
    const newEndDate = addMonths(baseDate, renewalMonths);

    try {
       // 1. Update Student
       const sRes = await fetch(`/api/students/${renewingStudent._id}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
           endDate: newEndDate,
           status: 'active' 
         })
       });

       if (sRes.ok) {
          // 2. Record New Meal Contract
          if (renewalFee && parseFloat(renewalFee) > 0) {
             const contractPayload = {
               studentId: renewingStudent._id,
               mealType: renewalMealType,
               durationMonths: renewalMonths,
               startDate: baseDate.toISOString(),
               amountINR: parseFloat(renewalFee),
               rubalRate: rubalRate ? parseFloat(rubalRate) : 0.92,
             };
             
             await fetch('/api/meal-contracts', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(contractPayload)
             });
          }

          // Update Local State
          setStudents(prev => prev.map(s => 
             s._id === renewingStudent._id 
               ? { ...s, endDate: newEndDate, status: 'active' } 
               : s
          ));
          setRenewingStudent(null);
          router.refresh();
       }

    } catch (err) {
      console.error('Renewal failed', err);
    }
  };

  return (
    <>
      {/* Mobile-responsive search and action bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center mb-4">
        <div className="relative w-full sm:w-72">
           <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
           <input 
             placeholder="Search students..." 
             className="flex h-11 sm:h-10 w-full rounded-xl border border-input bg-white px-3 py-2 pl-10 text-base sm:text-sm shadow-sm transition-colors focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        <Link href="/students/create" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-11 sm:h-10 bg-orange-600 hover:bg-orange-700 rounded-xl text-base sm:text-sm">
            <Plus className="mr-2 h-5 w-5 sm:h-4 sm:w-4" /> New ID Card
            </Button>
        </Link>
      </div>

      {/* Mobile-optimized grid - single column on small screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {filteredStudents.map((student) => {
                 // NEW LOGIC: Status is the source of truth
                 const isActive = student.status === 'active';
                 const hasMembership = !!student.endDate;
                 const isExpired = hasMembership && isPast(new Date(student.endDate));
                 
                 // Visual states based on actual status
                 const statusColor = isActive ? 'text-green-600' : 'text-gray-500';
                 const statusBg = isActive ? 'bg-green-50' : 'bg-gray-100';
                 const borderColor = isActive ? 'border-green-200' : 'border-gray-200';
                 const indicatorColor = isActive ? 'bg-green-500' : isExpired ? 'bg-red-500' : 'bg-gray-300';

                   return (
                   <Card key={student._id} className="group relative overflow-hidden bg-white border-0 shadow-sm active:scale-[0.98] transition-all duration-150 ring-1 ring-black/5 touch-manipulation">
                     {/* Status Indicator Line */}
                     <div className={`absolute top-0 left-0 w-1.5 h-full ${indicatorColor} rounded-l-xl`} />
                     
                     <CardContent className="p-4 pl-5">
                        <div className="flex justify-between items-start mb-3">
                           <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
                                   {student.photoUrl ? (
                                     <img src={student.photoUrl} alt={student.fullName} className="h-full w-full object-cover" />
                                   ) : (
                                     <UserCircle className="h-full w-full text-gray-300 bg-gray-50" />
                                   )}
                                </div>
                              <div className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                              </div>
                              <div className="min-w-0">
                                 <h3 className="font-bold text-sm leading-tight text-gray-900 group-hover:text-orange-700 transition-colors truncate max-w-[140px]">{student.fullName}</h3>
                                 <p className="text-[10px] font-medium text-gray-500 truncate max-w-[140px]">{student.course}</p>
                              </div>
                           </div>
                           
                           <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-gray-400 hover:text-gray-700">
                                   <MoreVertical className="h-3.5 w-3.5" />
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end" className="w-40">
                                 <DropdownMenuItem onClick={() => router.push(`/students/create?edit=${student._id}`)}>
                                   <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Details
                                 </DropdownMenuItem>
                                 <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(student._id)}>
                                   <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                 </DropdownMenuItem>
                               </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        
                        <div className="space-y-1.5 pt-1">
                           <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground text-[10px] uppercase">ID Number</span>
                              <span className="font-mono font-semibold text-gray-700 text-[11px]">{student.studentId}</span>
                           </div>
                           <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground text-[10px] uppercase">Batch</span>
                              <span className="font-medium text-[11px]">{student.year}</span>
                           </div>
                           <div className="pt-1.5 border-t border-dashed border-gray-100 mt-1.5">
                              <div className="flex justify-between items-center text-xs">
                                 <span className="text-muted-foreground text-[10px] uppercase">Membership</span>
                                 {/* Show status based on actual student.status field */}
                                 {isActive ? (
                                    <span className="font-semibold text-[10px] text-green-600">
                                       ✓ Active
                                       {hasMembership && !isExpired && (
                                         <span className="text-gray-500 ml-1">
                                           (until {format(new Date(student.endDate), 'MMM yy')})
                                         </span>
                                       )}
                                       {hasMembership && isExpired && (
                                         <span className="text-orange-500 ml-1">(Renewal Due)</span>
                                       )}
                                    </span>
                                 ) : (
                                    <span className="text-gray-400 italic text-[10px]">Archived</span>
                                 )}
                              </div>
                           </div>
                       </div>
                    </CardContent>
                    
                    <div className="p-2 bg-gray-50/80 backdrop-blur-sm border-t border-gray-100 flex gap-2">
                        {/* Renew Logic: Only show if Archived (Expired) */}
                        {activeTab === 'archived' && (
                          <Button 
                             className="flex-1 h-7 text-xs shadow-sm bg-orange-600 hover:bg-orange-700 text-white"
                             onClick={() => openRenewalModal(student)}
                          >
                             <RefreshCw className="mr-1.5 h-3 w-3" /> Renew
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          className={`h-7 text-xs bg-white hover:bg-gray-50 border-gray-200 text-gray-700 ${activeTab === 'active' ? 'flex-1' : ''}`}
                          onClick={() => {
                             router.push(`/students/create?edit=${student._id}&action=download`);
                          }}
                        >
                           <FileDown className="mr-1.5 h-3 w-3" /> ID Card
                        </Button>
                    </div>
                  </Card>
                 );
              })}
              
               {filteredStudents.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
                      <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">No students found</h3>
                      <p className="text-muted-foreground max-w-sm mt-1">
                        {searchTerm ? "Try adjusting your search terms." : `No ${activeTab} students available.`}
                      </p>
                      {searchTerm && (
                        <Button variant="link" onClick={() => setSearchTerm('')} className="mt-2 text-orange-600">
                          Clear Search
                        </Button>
                      )}
                  </div>
              )}
            </div>

      {/* Renewal Dialog */}
      <Dialog open={!!renewingStudent} onOpenChange={(open) => !open && setRenewingStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Membership</DialogTitle>
            <DialogDescription>
               Extend membership for <strong>{renewingStudent?.fullName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRenewal} className="space-y-4 py-2">
             <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label>Renewal Period</Label>
                    <div className="flex gap-2">
                       {[1, 3, 6, 12].map(m => (
                          <Button 
                            key={m} 
                            type="button" 
                            variant={renewalMonths === m ? 'default' : 'outline'}
                            onClick={() => setRenewalMonths(m)}
                            className="flex-1 px-1 h-8 text-xs"
                          >
                            {m}M
                          </Button>
                       ))}
                    </div>
                 </div>
                 <div className="grid gap-2">
                    <Label>Meal Type</Label>
                    <select 
                       className="flex h-8 w-full rounded-md border border-input px-2 text-sm bg-white focus:ring-1 focus:ring-orange-500/20"
                       value={renewalMealType}
                       onChange={(e) => setRenewalMealType(e.target.value)}
                    >
                       <option value="lunch">Lunch Only</option>
                       <option value="dinner">Dinner Only</option>
                       <option value="both">Lunch + Dinner</option>
                    </select>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label>Renewal Fee (INR)</Label>
                    <div className="relative">
                       <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                       <Input 
                          type="number" 
                          placeholder="0.00" 
                          className="pl-9"
                          value={renewalFee}
                          onChange={(e) => setRenewalFee(e.target.value)}
                       />
                    </div>
                 </div>
                 <div className="grid gap-2">
                    <Label>Rubal Rate</Label>
                    <div className="relative">
                       <span className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 font-bold">₽</span>
                       <Input 
                          type="number" 
                          step="0.01"
                          placeholder="Rate" 
                          className="pl-9"
                          value={rubalRate}
                          onChange={(e) => setRubalRate(e.target.value)}
                       />
                    </div>
                 </div>
             </div>
             {renewalFee && rubalRate && (
               <p className="text-xs text-right font-mono text-muted-foreground">
                   ≈ {(parseFloat(renewalFee) * parseFloat(rubalRate)).toFixed(2)} RUB
               </p>
             )}
             
             <DialogFooter>
               <Button type="button" variant="outline" onClick={() => setRenewingStudent(null)}>Cancel</Button>
               <Button type="submit" className="bg-green-600 hover:bg-green-700">Confirm Renewal</Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
