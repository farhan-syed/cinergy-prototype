import React, { useState } from 'react';
import { Appointment, LocationType, ConfirmationStatus } from '../types';

interface IntakeFormProps {
  onAdd: (appt: Appointment) => void;
  owners: string[];
}

const IntakeForm: React.FC<IntakeFormProps> = ({ onAdd, owners }) => {
  const [formData, setFormData] = useState<Partial<Appointment>>({
    owner: owners[0] || 'Cindy',
    time: '9:00',
    location: LocationType.OFC,
    confirmation: ConfirmationStatus.N,
    zoomLink: '',
    phone: '',
    email: '',
  });

  // State to track if the user wants to email the zoom link
  const [sendZoomEmail, setSendZoomEmail] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.time || !formData.owner) return;

    const newAppt: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      owner: formData.owner!,
      time: formData.time!,
      clientName: formData.clientName!,
      description: formData.description || '',
      lastAcctSummary: formData.lastAcctSummary || '',
      phone: formData.phone || '',
      email: formData.email || '',
      location: formData.location || LocationType.OFC,
      zoomLink: formData.location === LocationType.ZOOM ? (formData.zoomLink || 'https://zoom.us') : undefined,
      confirmation: formData.confirmation || ConfirmationStatus.N,
      dppsValue: formData.dppsValue || '',
      ifsValue: formData.ifsValue || '',
      rmdCheck: false,
      zoomLinkSent: sendZoomEmail // Track if we "sent" the link
    };

    onAdd(newAppt);

    // Simulate sending email if checkbox is checked
    if (sendZoomEmail && newAppt.zoomLink) {
        const recipient = formData.email || "the client";
        // In a real application, this would trigger a backend service
        alert(`Zoom invitation link has been sent to ${recipient}!`);
    }

    // Reset fields, keeping owner but resetting critical info
    setFormData(prev => ({
      ...prev,
      clientName: '',
      description: '',
      phone: '',
      email: '',
      dppsValue: '',
      ifsValue: '',
      zoomLink: '',
      location: LocationType.OFC, // Reset to default non-Zoom location
      lastAcctSummary: ''
    }));
    // Reset the email checkbox
    setSendZoomEmail(false);
  };

  // Modernized, lighter styling matching ScheduleTable aesthetics
  const inputClass = "mt-1 block w-full rounded-md border-slate-200 shadow-sm focus:border-cinergy-500 focus:ring-cinergy-500 text-sm py-2 px-3 border bg-white text-slate-700 placeholder-slate-400 transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header aligned with ScheduleTable */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
        <h2 className="text-xl font-bold text-slate-800">New Event</h2>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Intake Form</p>
      </div>
      
      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Logistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>Owner</label>
              <select name="owner" value={formData.owner} onChange={handleChange} className={inputClass}>
                {owners.map(o => <option key={o} value={o}>{o}</option>)}
                <option value="New Person">Add New Person...</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Time</label>
              <input type="text" name="time" placeholder="9:00" value={formData.time} onChange={handleChange} className={inputClass}/>
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <select name="location" value={formData.location} onChange={handleChange} className={inputClass}>
                {Object.values(LocationType).map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Zoom Link Field */}
          {formData.location === LocationType.ZOOM && (
            <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-1">
              <label className={`${labelClass} text-blue-700`}>Zoom Meeting Link</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-3.5 17.5c-1.104 0-2-.896-2-2s.896-2 2-2 2 .896 2 2-.896 2-2 2zm8 0c-1.104 0-2-.896-2-2s.896-2 2-2 2 .896 2 2-.896 2-2 2zm3.5-3.5c0 1.104-.896 2-2 2s-2-.896-2-2 .896-2 2-2 2 .896 2 2z"/>
                  </svg>
                </div>
                <input 
                  type="url" 
                  name="zoomLink" 
                  value={formData.zoomLink || ''} 
                  onChange={handleChange} 
                  placeholder="https://zoom.us/j/..." 
                  className={`${inputClass} pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500`} 
                />
              </div>
            </div>
          )}

          {/* Section 2: Client Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Client Name</label>
              <input type="text" name="clientName" value={formData.clientName || ''} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Topic / Description</label>
              <input type="text" name="description" value={formData.description || ''} onChange={handleChange} placeholder="e.g. Tax strategies" className={inputClass} />
            </div>
          </div>

          {/* Section 3: Contact & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>Phone</label>
              <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="555-0123" className={inputClass} />
            </div>
             <div>
              <label className={labelClass}>Email</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} placeholder="client@example.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Confirmation</label>
              <select name="confirmation" value={formData.confirmation} onChange={handleChange} className={inputClass}>
                {Object.values(ConfirmationStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 4: Financials & Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className={labelClass}>Last Acct Summary</label>
              <input type="text" name="lastAcctSummary" value={formData.lastAcctSummary || ''} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Avail. for DPPs</label>
              <input type="text" name="dppsValue" value={formData.dppsValue || ''} onChange={handleChange} className={inputClass} />
            </div>
            <div className="space-y-3">
               <div>
                  <label className={labelClass}>Avail. for IFs</label>
                  <input type="text" name="ifsValue" value={formData.ifsValue || ''} onChange={handleChange} className={inputClass} />
               </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-5">
            {/* Email Checkbox - Only shows if Zoom Link is present */}
             {formData.zoomLink && formData.location === LocationType.ZOOM && (
                <div className="flex items-center animate-in fade-in">
                  <input
                    id="sendZoomEmail"
                    type="checkbox"
                    checked={sendZoomEmail}
                    onChange={(e) => setSendZoomEmail(e.target.checked)}
                    className="h-4 w-4 text-cinergy-600 focus:ring-cinergy-500 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="sendZoomEmail" className="ml-2 block text-sm font-medium text-slate-700 cursor-pointer select-none">
                    Send Zoom link to client's email
                  </label>
                </div>
              )}

            <button 
              type="submit" 
              className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all active:scale-95"
            >
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IntakeForm;