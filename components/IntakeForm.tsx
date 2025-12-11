
import React, { useState, useEffect } from 'react';
import { Appointment, LocationType, ConfirmationStatus } from '../types';

interface IntakeFormProps {
  onSubmit: (appt: Appointment) => void;
  onCancel?: () => void;
  owners: string[];
  initialData?: Appointment;
}

// Mock Redtail Data
const MOCK_REDTAIL_CLIENTS = [
  { id: 'r1', name: 'Dina Wadi', phone: '555-0101', email: 'dina.wadi@example.com', description: 'Nook windows' },
  { id: 'r2', name: 'Trevor McAlester', phone: '949-874-7082', email: 'trevor.m@example.com', description: 'Nationwide benefit' },
  { id: 'r3', name: 'Ronnie Torres', phone: '714-960-4700', email: 'ronnie@example.com', description: 'Group Health Insurance' },
  { id: 'r4', name: 'Florence Chan', phone: '925-913-0072', email: 'florence.c@example.com', description: 'Tax strategies' },
  { id: 'r5', name: 'Ellen Tunkelrott', phone: '310-503-1874', email: 'tunkelrott@gmail.com', description: 'Income streams' },
  { id: 'r6', name: 'Henry Mittel', phone: '925-913-0072', email: 'henry.m@example.com', description: 'Tax strategies' },
];

const IntakeForm: React.FC<IntakeFormProps> = ({ onSubmit, onCancel, owners, initialData }) => {
  const [formData, setFormData] = useState<Partial<Appointment>>({
    owner: owners[0] || 'Cindy',
    time: '9:00',
    location: LocationType.OFC,
    confirmation: ConfirmationStatus.N,
    zoomLink: '',
    phone: '',
    email: '',
    notes: '',
    clientName: '',
    description: '',
    lastAcctSummary: '',
    dppsValue: '',
    ifsValue: ''
  });

  // State to track if the user wants to email the zoom link
  const [sendZoomEmail, setSendZoomEmail] = useState(false);
  
  // Redtail Search State (Driven by Client Name input now)
  const [showRedtailResults, setShowRedtailResults] = useState(false);

  // Initialize form data if editing
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // If editing an existing appointment with a zoom link, we assume it was "sent" or doesn't need sending again immediately unless checked
      setSendZoomEmail(false); 
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, clientName: value }));
    setShowRedtailResults(true);
  };

  const selectRedtailClient = (client: typeof MOCK_REDTAIL_CLIENTS[0]) => {
    setFormData(prev => ({
      ...prev,
      clientName: client.name,
      phone: client.phone,
      email: client.email,
      // Description is intentionally not updated to keep it disassociated from Redtail
    }));
    setShowRedtailResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.time || !formData.owner) return;

    const newAppt: Appointment = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
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
      rmdCheck: initialData?.rmdCheck || false,
      zoomLinkSent: sendZoomEmail || initialData?.zoomLinkSent, // Preserve sent status if editing, or set if checking box
      notes: formData.notes || ''
    };

    onSubmit(newAppt);

    // Simulate sending email if checkbox is checked
    if (sendZoomEmail && newAppt.zoomLink) {
        const recipient = formData.email || "the client";
        // In a real application, this would trigger a backend service
        alert(`Zoom invitation link has been sent to ${recipient}!`);
    }

    if (!initialData) {
        // Reset fields only if adding new
        setFormData(prev => ({
          ...prev,
          clientName: '',
          description: '',
          phone: '',
          email: '',
          dppsValue: '',
          ifsValue: '',
          zoomLink: '',
          location: LocationType.OFC, 
          lastAcctSummary: '',
          notes: ''
        }));
        setSendZoomEmail(false);
    }
  };

  // Filter based on the current clientName input
  const filteredRedtailClients = formData.clientName 
    ? MOCK_REDTAIL_CLIENTS.filter(c => c.name.toLowerCase().includes((formData.clientName || '').toLowerCase()))
    : [];

  // Modernized, lighter styling matching ScheduleTable aesthetics
  const inputClass = "mt-1 block w-full rounded-md border-slate-200 shadow-sm focus:border-cinergy-500 focus:ring-cinergy-500 text-sm py-2 px-3 border bg-white text-slate-700 placeholder-slate-400 transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5";

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${initialData ? 'border-0 shadow-none' : ''}`}>
      {/* Header - Hide if we are in the modal/edit mode because modal has its own header usually, or keep it consistency */}
      {!initialData && (
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
            <h2 className="text-xl font-bold text-slate-800">New Event</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Intake Form</p>
        </div>
      )}
      
      <div className={initialData ? "p-0" : "p-8"}>
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

          {/* Section 2: Client Details (Visual grouping for Redtail) */}
          <div className="border border-slate-100 rounded-lg p-5 bg-slate-50/30">
              <div className="relative">
                <label className={labelClass}>Client Name</label>
                <div className="relative">
                    <input 
                      type="text" 
                      name="clientName" 
                      value={formData.clientName || ''} 
                      onChange={handleNameChange}
                      onFocus={() => setShowRedtailResults(true)}
                      onBlur={() => setTimeout(() => setShowRedtailResults(false), 200)}
                      className={`${inputClass} pr-10`}
                      placeholder="Enter name or search Redtail..."
                      autoComplete="off"
                      required 
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>

                    {/* Redtail Autocomplete Dropdown */}
                    {showRedtailResults && formData.clientName && filteredRedtailClients.length > 0 && (
                       <div className="absolute z-50 mt-1 w-full bg-white shadow-xl rounded-md border border-slate-200 overflow-hidden ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-3 py-2 bg-red-50 border-b border-red-100 flex items-center justify-between">
                             <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="none"/><path d="M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm1 14h-2v-2h2v2zm0-4h-2V7h2v7z"/></svg>
                                Redtail CRM Matches
                             </span>
                          </div>
                          <ul className="max-h-60 overflow-auto">
                            {filteredRedtailClients.map(client => (
                              <li 
                                key={client.id}
                                onClick={() => selectRedtailClient(client)}
                                className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                              >
                                 <div className="font-semibold text-sm text-slate-800">{client.name}</div>
                                 <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                    <span className="truncate max-w-[150px]">{client.email}</span>
                                    <span className="text-slate-300">•</span>
                                    <span>{client.phone}</span>
                                 </div>
                              </li>
                            ))}
                          </ul>
                      </div>
                    )}
                </div>
              </div>
          </div>

          {/* Topic / Description - Disassociated from Client Section */}
          <div>
             <label className={labelClass}>Topic / Discussion</label>
             <input type="text" name="description" value={formData.description || ''} onChange={handleChange} placeholder="e.g. Tax strategies" className={inputClass} />
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

          {/* New Notes Section */}
          <div className="pt-2">
            <label className={labelClass}>Notes</label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes || ''}
              onChange={handleChange}
              placeholder="Add any additional internal notes here..."
              className={inputClass}
            />
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
            
            {onCancel && (
               <button 
                 type="button" 
                 onClick={onCancel}
                 className="px-6 py-2.5 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
               >
                 Cancel
               </button>
            )}

            <button 
              type="submit" 
              className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all active:scale-95"
            >
              {initialData ? 'Update Event' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IntakeForm;
