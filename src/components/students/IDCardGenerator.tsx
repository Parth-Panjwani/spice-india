'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import html2canvas from 'html2canvas';

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
    tenure: '3',
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
              tenure: data.tenure || '3',
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
            handleDownloadImage();
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

  const handleDownloadImage = async () => {
    if (!cardRef.current) {
       console.error("Card Ref is null");
       alert("Error: Card preview not found. Please try refreshing.");
       return;
    }
    
    try {
      console.log("Starting Image generation...");
      
      // Wait a moment for images to ensure they are rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(cardRef.current, { 
        scale: 4, // High Resolution
        useCORS: true, 
        logging: false,
        backgroundColor: null, // Transparent if needed
        allowTaint: true,
        onclone: (clonedDoc) => {
           const body = clonedDoc.body;
           body.style.backgroundColor = '#ffffff';
           
           // Ensure cleanly rendered styles
           const clonedCard = clonedDoc.querySelector('[data-id-card="true"]');
           if (clonedCard) {
               // Ensure no external interference, although inline styles handle mostly everything
           }
        }
      });

      console.log("Canvas captured");

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Trigger Download Link
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${formData.fullName.replace(/\s+/g, '_')}_ID.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("Image Saved");

    } catch (err: any) {
      console.error('Image Gen Error', err);
      alert(`Failed to generate Image: ${err.message || err}`);
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
    const endDateObj = addMonths(startDateObj, parseInt(formData.tenure));

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

            <div className="grid grid-cols-2 gap-3">
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
                    Valid until: {format(addMonths(new Date(formData.startDate), parseInt(formData.tenure)), 'dd MMM yyyy')}
                  </p>
               </div>
               <div>
                   <label className="text-[10px] font-semibold uppercase text-muted-foreground mb-1 block">Tenure</label>
                   <select 
                      className="flex h-8 w-full rounded-md border border-input px-2 text-sm bg-white focus:ring-1 focus:ring-orange-500/20"
                      value={formData.tenure}
                      onChange={(e) => setFormData({...formData, tenure: e.target.value})}
                   >
                      <option value="1">1 Month</option>
                      <option value="2">2 Months</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">1 Year</option>
                   </select>
               </div>
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
                   <Button type="button" variant="outline" onClick={handleDownloadImage} className="flex-1 h-9 border-gray-300 text-sm">
                     <Download className="mr-1.5 h-3.5 w-3.5" /> Download Image
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
                data-id-card="true"
                className="overflow-hidden relative flex flex-col items-center"
                style={{ 
                  width: '54mm',
                  height: '85.6mm',
                  fontFamily: 'Arial, sans-serif',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  letterSpacing: 'normal'
                }}
              >
                 {/* Top Section Wrapper */}
                 <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     {/* Top Decorative Strip - Reduced height for safety buffer */}
                     <div 
                        style={{
                            width: '100%',
                            height: '20mm', // Reduced to 20mm
                            background: 'linear-gradient(to bottom, #f97316, #dc2626)',
                            borderRadius: '0 0 50% 50% / 0 0 12mm 12mm',
                            position: 'relative',
                            marginBottom: '6mm' // Tighter spacing
                        }}
                     ></div>

                     {/* Photo Container Wrapper */}
                     <div style={{ position: 'relative', marginTop: '-14mm', alignSelf: 'center', width: '22mm', height: '22mm', zIndex: 10 }}>
                         {/* Actual Photo Circle */}
                         <div 
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                border: '3px solid #ffffff',
                                backgroundColor: '#f3f4f6',
                                overflow: 'hidden',
                                position: 'relative',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                         >
                            {formData.photoUrl ? (
                               <img src={formData.photoUrl} alt="S" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                            ) : (
                               <UserCircle style={{ height: '100%', width: '100%', color: '#9ca3af', padding: '2px' }} />
                            )}
                         </div>
                        
                         {/* Year Badge */}
                         <div 
                            style={{
                                position: 'absolute',
                                bottom: '9px', 
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center'
                            }}
                         >
                            <span
                                style={{
                                    fontSize: '9px',
                                    fontWeight: '900',
                                    height: '16px', 
                                    lineHeight: '16px', // Reliable centering
                                    padding: '0 10px',
                                    backgroundColor: '#111827',
                                    color: '#ffffff',
                                    borderRadius: '6px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                    border: '1px solid #ffffff',
                                    display: 'inline-block', // Inline block for width/height respect
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                               {formData.year}
                            </span>
                         </div>
                     </div>
                 </div>

                 {/* Typography Section - Centered Content */}
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '0 4mm' }}>
                    
                    {/* Logo - Fixed aspect ratio safer for PDF */}
                    <div style={{ width: '24mm', height: '8mm', marginBottom: '1mm', display: 'flex', justifyContent: 'center' }}>
                         <img 
                           src="/SpiceIndia_Logo.png" 
                           alt="SpiceIndia" 
                           style={{ height: '100%', width: 'auto', maxWidth: '100%', objectFit: 'contain' }} 
                           crossOrigin="anonymous"
                         />
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', color: '#111827', lineHeight: '1.2', textAlign: 'center', marginBottom: '1px' }}>
                        {formData.fullName || 'STUDENT NAME'}
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#ea580c', letterSpacing: '0.5px', textAlign: 'center' }}>
                        {formData.course || 'COURSE NAME'}
                    </div>

                    {/* Divider - Minimal */}
                    <div style={{ width: '16px', height: '2px', backgroundColor: '#e5e7eb', margin: '2mm auto 2mm' }}></div>

                    {/* Footer Details - Robust Vertical Fit */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1mm', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '6px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>ID Number</div>
                            <div style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold', color: '#374151', lineHeight: '1.2' }}>
                                {formData.studentId || 'SI-XXXX'}
                            </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '6px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Valid Until</div>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#111827', lineHeight: '1.2' }}>
                                {format(addMonths(new Date(formData.startDate), 3), 'MMM yyyy').toUpperCase()}
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Bottom Strip */}
                 <div 
                    style={{ 
                        width: '100%', 
                        height: '5mm', 
                        background: '#ea580c',
                        marginTop: 'auto'
                    }}
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
