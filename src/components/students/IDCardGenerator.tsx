'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Save, Upload, IndianRupee, RefreshCw, UserCircle, ArrowLeft } from 'lucide-react';
import { addMonths, format } from 'date-fns';

export default function IDCardGenerator() {
  const currentYear = new Date().getFullYear();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    course: '',
    year: currentYear.toString(),
    photoUrl: '',
    startDate: new Date().toISOString().split('T')[0],
  });
  
  const [messFee, setMessFee] = useState(''); 
  const [rubalRate, setRubalRate] = useState(''); // Default optional
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load Data if Editing
  useEffect(() => {
    if (editId) {
      setLoading(true);
      // Fetch Student Data
      fetch(`/api/students/${editId}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setFormData({
              fullName: data.fullName,
              studentId: data.studentId,
              course: data.course,
              year: data.year,
              photoUrl: data.photoUrl || '',
              startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            });
            
            // Fetch Latest Fee Info for this student
            fetch(`/api/income?studentId=${data._id}`)
                .then(res => res.json())
                .then(incomes => {
                    if (Array.isArray(incomes) && incomes.length > 0) {
                        // Assuming the most recent one is the membership fee
                        const latest = incomes[0];
                        setMessFee(latest.amount.toString());
                        if (latest.rubalRate) setRubalRate(latest.rubalRate.toString());
                    }
                })
                .catch(e => console.error("Could not fetch fees", e));
          }
        })
        .finally(() => setLoading(false));
    }
  }, [editId]);

  // Auto-Generate ID on Mount or Year Change
  useEffect(() => {
    if (!formData.studentId && !editId) {
      generateId();
    }
  }, [formData.year, editId]);

  // Auto-Download if requested
  useEffect(() => {
    if (searchParams.get('action') === 'download' && formData.fullName) {
        // slight delay to allow render
        setTimeout(() => {
            handleDownloadPDF();
        }, 1000);
    }
  }, [searchParams, formData.fullName]);

  const generateId = () => {
    if (editId) return; // Don't auto-gen on edit
    const random = Math.floor(1000 + Math.random() * 9000); 
    const newId = `SI-${formData.year}-${random}`;
    setFormData(prev => ({ ...prev, studentId: newId }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) {
       console.error("Card Ref is null");
       alert("Error: Card preview not found. Please try refreshing.");
       return;
    }
    
    try {
      console.log("Starting PDF generation...");
      
      // Wait a moment for images to ensure they are rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(cardRef.current, { 
        scale: 4, 
        useCORS: true, 
        logging: true,
        backgroundColor: '#ffffff',
        allowTaint: false,
      });

      console.log("Canvas captured");

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 54]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54);
      pdf.save(`${formData.fullName.replace(/\s+/g, '_')}_ID.pdf`);
      console.log("PDF Saved");

    } catch (err: any) {
      console.error('PDF Gen Error', err);
      alert(`Failed to generate PDF: ${err.message || err}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict Fee Validation on Creation
    if (!editId && (!messFee || parseFloat(messFee) <= 0)) {
       alert("Membership Fee is mandatory for new students.");
       return;
    }

    setLoading(true);

    const startDateObj = new Date(formData.startDate);
    const endDateObj = addMonths(startDateObj, 3); // Default 3 months membership

    try {
      const url = editId ? `/api/students/${editId}` : '/api/students';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: startDateObj.toISOString(),
          endDate: endDateObj.toISOString(),
          status: 'active' // ALWAYS force active status
        }),
      });

      if (res.ok) {
        const student = await res.json();
        
        // 2. Save Income (Mess Fee) - ONLY on NEW Creation, NOT on Edit
        if (!editId && messFee && parseFloat(messFee) > 0) {
             // Debug logging
             console.log('Creating income with:', { messFee, rubalRate, calculatedRubal: rubalRate ? parseFloat(messFee) * parseFloat(rubalRate) : 'none' });
             
             const incomePayload = {
               amount: parseFloat(messFee),
               rubalAmount: rubalRate && parseFloat(rubalRate) > 0 ? parseFloat(messFee) * parseFloat(rubalRate) : undefined,
               rubalRate: rubalRate && parseFloat(rubalRate) > 0 ? parseFloat(rubalRate) : undefined,
               studentId: student._id,
               description: `Membership Fee (${format(startDateObj, 'MMM yyyy')} - ${format(endDateObj, 'MMM yyyy')})`
             };
             console.log('Income payload:', incomePayload);
             
             await fetch('/api/income', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(incomePayload)
             });
        }

        router.push('/students');
        router.refresh();
      } else {
        alert("Failed to save student.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid xl:grid-cols-2 gap-6 items-start">
      {/* Input Form */}
      <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white">
        <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-gray-100">
          <CardTitle className="text-lg font-bold text-gray-900">{editId ? 'Edit Student ID' : 'New Membership'}</CardTitle>
          {editId && (
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-5 space-y-5">
          <form onSubmit={handleSave} className="space-y-4">
            
            <div className="grid grid-cols-3 gap-3">
               {/* Year / Batch Selection */}
               <div className="col-span-1">
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground mb-1 block">Batch Year</label>
                  <select
                    className="flex h-8 w-full rounded-md border border-input px-2 text-sm bg-background focus:ring-1 focus:ring-orange-500/20"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                  >
                    <option value={currentYear}>{currentYear}</option>
                    <option value={currentYear + 1}>{currentYear + 1}</option>
                  </select>
               </div>

               {/* Auto ID Display */}
               <div className="col-span-2">
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground mb-1 block">Student ID</label>
                  <div className="flex gap-2">
                    <input 
                      disabled={!editId} 
                      className="flex h-8 w-full rounded-md border border-input px-2 text-sm bg-gray-50 text-gray-700 font-mono font-medium"
                      value={formData.studentId}
                      onChange={(e) => editId && setFormData({...formData, studentId: e.target.value})} 
                    />
                    {!editId && (
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={generateId} title="Regenerate ID">
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="text-[10px] font-semibold uppercase text-muted-foreground mb-1 block">Full Name</label>
                   <input 
                     className="flex h-8 w-full rounded-md border border-input px-2 text-sm focus:ring-1 focus:ring-orange-500/20"
                     value={formData.fullName}
                     onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                     required
                     placeholder="e.g. Rahul Sharma"
                   />
                </div>

                <div>
                   <label className="text-[10px] font-semibold uppercase text-muted-foreground mb-1 block">Course</label>
                   <input 
                     className="flex h-8 w-full rounded-md border border-input px-2 text-sm focus:ring-1 focus:ring-orange-500/20"
                     value={formData.course}
                     onChange={(e) => setFormData({...formData, course: e.target.value})}
                     required
                     placeholder="e.g. MBBS"
                   />
                </div>
            </div>

            {/* Date Selection */}
            <div>
               <label className="text-[10px] font-semibold uppercase text-muted-foreground mb-1 block">Start Date</label>
               <input 
                 type="date"
                 className="flex h-8 w-full rounded-md border border-input px-2 text-sm"
                 value={formData.startDate}
                 onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                 required
               />
               <p className="text-[10px] text-orange-600 mt-1 font-medium">
                 Valid until: {format(addMonths(new Date(formData.startDate), 3), 'dd MMM yyyy')}
               </p>
            </div>

            {/* Mess Fee Section - Compact & With Rubal */}
            <div className="bg-orange-50/50 p-3 rounded-md border border-orange-100">
               <label className="text-xs font-bold text-orange-900 mb-2 flex items-center justify-between">
                 <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" /> Fee (Mandatory)</span>
                 <span className="text-[10px] bg-orange-100 px-1.5 py-0.5 rounded text-orange-700">Membership Fee</span>
               </label>
               
               <div className="grid grid-cols-2 gap-2">
                   <div>
                       <label className="text-[10px] text-orange-700 mb-0.5 block">Amount (INR)</label>
                       <input 
                         type="number"
                         className="flex h-8 w-full rounded-md border border-orange-200 px-2 text-sm bg-white"
                         placeholder="₹"
                         value={messFee}
                         onChange={(e) => setMessFee(e.target.value)}
                         required={!editId} 
                       />
                   </div>
                   <div>
                       <label className="text-[10px] text-orange-700 mb-0.5 block">Rubal Rate (Today)</label>
                       <div className="relative">
                           <input 
                             type="number"
                             step="0.01"
                             className="flex h-8 w-full rounded-md border border-orange-200 px-2 text-sm bg-white"
                             placeholder="Rate"
                             value={rubalRate}
                             onChange={(e) => setRubalRate(e.target.value)}
                           />
                           <span className="absolute right-2 top-2 text-[10px] text-muted-foreground">₽</span>
                       </div>
                   </div>
               </div>
               
               {messFee && rubalRate && (
                   <div className="mt-2 text-xs text-right font-mono font-medium text-orange-800">
                       ≈ {(parseFloat(messFee) * parseFloat(rubalRate)).toFixed(2)} RUB
                   </div>
               )}
            </div>

            {/* Photo Upload */}
            <div>
               <label className="text-[10px] font-semibold uppercase text-muted-foreground mb-1 block">Photo</label>
               <div className="flex items-center gap-2 p-2 border border-dashed rounded-md hover:bg-gray-50 transition-colors">
                 <input 
                   type="file" 
                   accept="image/*"
                   onChange={handlePhotoUpload}
                   className="hidden" 
                   id="photo-upload"
                 />
                 <label htmlFor="photo-upload" className="cursor-pointer flex items-center gap-2 py-1 px-2 cream-btn border rounded shadow-sm text-xs font-medium hover:bg-gray-100">
                   <Upload className="h-3 w-3" /> Upload
                 </label>
                 {formData.photoUrl ? (
                    <span className="text-[10px] text-green-600 font-medium flex items-center gap-1"><span className="h-1.5 w-1.5 bg-green-500 rounded-full"></span> OK</span>
                 ) : (
                    <span className="text-[10px] text-muted-foreground">No file</span>
                 )}
               </div>
            </div>

            <div className="pt-2 flex gap-2">
               <Button type="submit" disabled={loading} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white h-9 text-sm shadow-sm">
                 <Save className="mr-1.5 h-3.5 w-3.5" /> {editId ? 'Update' : 'Create Student'}
               </Button>
               {editId && (
                   <Button type="button" variant="outline" onClick={handleDownloadPDF} className="flex-1 h-9 border-gray-300 text-sm">
                     <Download className="mr-1.5 h-3.5 w-3.5" /> ID Card
                   </Button>
               )}
            </div>
          </form>
        </CardContent>
      </Card>

       {/* Preview Section */}
       <div className="space-y-6">
         <div>
            <h3 className="text-xl font-bold text-gray-900">Live Preview</h3>
            <p className="text-sm text-muted-foreground">This is how the card will look when printed.</p>
         </div>
         
         <div className="flex justify-center items-center bg-gray-100/80 p-12 rounded-xl border border-dashed min-h-[400px]">
             {/* The ID Card DOM Element */}
              <div 
                ref={cardRef} 
                className="w-[85.6mm] h-[54mm] rounded-xl shadow-2xl overflow-hidden relative flex flex-col"
                style={{ 
                  fontFamily: '"Inter", sans-serif',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                 {/* Header - Clean White with Orange Accent */}
                 <div className="px-5 pt-4 pb-2 flex justify-between items-start">
                    {/* Logo - Large and Free */}
                    <div className="w-[35mm] h-[12mm] relative">
                       <img 
                         src="/SpiceIndia_Logo.png" 
                         alt="SpiceIndia" 
                         className="w-full h-full object-contain object-left"
                         crossOrigin="anonymous"
                       />
                    </div>
                    
                    {/* Valid Date Tag */}
                    <div 
                      className="text-[9px] font-semibold px-2 py-1 rounded-full border"
                      style={{ 
                          backgroundColor: '#fff7ed', // orange-50
                          color: '#ea580c', // orange-600
                          borderColor: '#ffedd5' // orange-100
                      }}
                    >
                      VALID: {format(addMonths(new Date(formData.startDate), 3), 'MMM yyyy').toUpperCase()}
                    </div>
                 </div>
                 
                 {/* Content - Spacious with Grid */}
                 <div className="flex-1 px-6 pb-4 flex items-center gap-6">
                    {/* Photo: Clean Circle or Rounded Square without heavy border */}
                    <div className="relative">
                       <div 
                          className="h-[24mm] w-[24mm] rounded-lg overflow-hidden border shadow-sm flex items-center justify-center"
                          style={{
                              backgroundColor: '#f9fafb', // gray-50
                              borderColor: '#e5e7eb' // gray-200
                          }}
                       >
                           {formData.photoUrl ? (
                             <img src={formData.photoUrl} alt="S" className="w-full h-full object-cover" crossOrigin="anonymous" />
                           ) : (
                             <UserCircle className="h-12 w-12" style={{ color: '#d1d5db' }} />
                           )}
                       </div>
                       {/* Batch Badge */}
                       <div 
                          className="absolute -bottom-2 -right-2 text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm"
                          style={{
                              backgroundColor: '#111827', // gray-900
                              color: '#ffffff'
                          }}
                       >
                         {formData.year}
                       </div>
                    </div>
                    
                    {/* Details - Clean Typography */}
                    <div className="flex-1 min-w-0">
                       <div className="text-[14px] font-extrabold uppercase leading-tight truncate" style={{ color: '#111827' }}>
                          {formData.fullName || 'STUDENT NAME'}
                       </div>
                       <div className="text-[10px] font-semibold uppercase tracking-wide mt-1 truncate" style={{ color: '#ea580c' }}>
                          {formData.course || 'COURSE NAME'}
                       </div>
                       
                       <div className="mt-3 flex flex-col gap-0.5">
                         <div className="text-[8px] font-medium uppercase tracking-wider" style={{ color: '#9ca3af' }}>ID Number</div>
                         <div className="text-[11px] font-mono font-bold tracking-tight" style={{ color: '#374151' }}>
                            {formData.studentId || 'SI-XXXX-XXXX'}
                         </div>
                       </div>
                    </div>
                 </div>

                 {/* Footer - Minimalist Gradient */}
                 <div 
                    className="h-1.5 w-full" 
                    style={{ background: 'linear-gradient(to right, #f97316, #dc2626)' }}
                 ></div>
              </div>
         </div>
         <p className="text-center text-xs text-muted-foreground">
            Standard ID-1 Format (85.60 × 53.98 mm)
         </p>
       </div>

    </div>
  );
}
