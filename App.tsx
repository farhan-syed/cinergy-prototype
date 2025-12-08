import React, { useState } from 'react';
import { Appointment, LocationType, ConfirmationStatus } from './types';
import ScheduleTable from './components/ScheduleTable';
import IntakeForm from './components/IntakeForm';

// Initial Dummy Data
const INITIAL_DATA: Appointment[] = [
  // Cindy's Data
  {
    id: '1', owner: 'Cindy', time: '9:00', clientName: 'Dina Wadi - Nook windows', description: '', 
    phone: '', email: '', location: 'HOUSE', confirmation: '', dppsValue: '', ifsValue: ''
  },
  {
    id: '2', owner: 'Cindy', time: '10:00', clientName: 'Trevor McAlester', description: 'Nationwide benfit for his son upon Trevor\'s death', 
    lastAcctSummary: '10/9/2025', phone: '949-874-7082', location: 'PH', confirmation: 'Y', dppsValue: 'Only has Annuities', ifsValue: ''
  },
  {
    id: '3', owner: 'Cindy', time: '11:00', clientName: 'Ronnie Torres', description: 'Group Health Insurance', 
    lastAcctSummary: 'CIF insurance', phone: '714-960-4700', email: 'ronnie@example.com', location: 'Zoom', zoomLink: 'https://zoom.us/j/123456789', zoomLinkSent: true, confirmation: 'Y', dppsValue: 'NA', ifsValue: ''
  },
  {
    id: '4', owner: 'Cindy', time: '1:00', clientName: 'Florence Chan and Henry Mittel', description: 'Tax strategies', 
    lastAcctSummary: '9/24/2025', phone: '925-913-0072', email: '', location: 'OFC', confirmation: 'Y', dppsValue: '$1,000,000', ifsValue: '$69...'
  },
  // Leticia's Data
  {
    id: '5', owner: 'Leticia', time: '9:30', clientName: 'Ellen Tunkelrott', description: 'Income streams',
    lastAcctSummary: '9/15/2025', phone: '310-503-1874', email: 'tunkelrott@gmail.com', location: 'Zoom', zoomLink: 'https://zoom.us/my/leticia', zoomLinkSent: true, confirmation: 'LM | Sent Email', dppsValue: '$301,000', ifsValue: ''
  },
  {
    id: '6', owner: 'Staff', time: '10:00', clientName: 'Intern', description: '', 
    lastAcctSummary: '', phone: 'Project Initiative meeting', location: 'OFC', confirmation: 'Y', dppsValue: '', ifsValue: ''
  }
];

export default function App() {
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<'view' | 'intake'>('view');

  const owners = Array.from(new Set(appointments.map(a => a.owner)));
  const allOwners = Array.from(new Set([...owners, 'Cindy', 'Leticia', 'Staff']));

  const handleAddAppointment = (newAppt: Appointment) => {
    setAppointments(prev => [...prev, newAppt]);
    setActiveTab('view');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans print:pb-0 print:bg-white">
      {/* Navbar - Hidden on print */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden no-print">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Cinergy Financial</h1>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('view')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'view' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              View Schedule
            </button>
            <button 
              onClick={() => setActiveTab('intake')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'intake' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Add Event
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 print:w-full print:max-w-none print:p-0">
        
        {/* Hero Section */}
        {activeTab === 'view' && (
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 print:mb-4">
            <div>
              <p className="text-sm font-medium text-cinergy-600 uppercase tracking-wider mb-1">Daily Schedule</p>
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight print:text-3xl">Friday December 5, 2025</h2>
            </div>
            
            <div className="flex items-center gap-3 print:hidden no-print">
               {/* Print Button - Hidden when printing */}
               <button 
                 type="button"
                 onClick={() => window.print()}
                 className="no-print flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                 <span>Print Schedule</span>
               </button>
            </div>
          </div>
        )}
        
        {/* Content */}
        {activeTab === 'view' ? (
          <div className="space-y-10 print:space-y-6">
            {allOwners.map(owner => {
              const ownerAppts = appointments.filter(a => a.owner === owner);
              return (
                <div key={owner} className="print-break-inside-avoid">
                  <ScheduleTable 
                    owner={owner}
                    appointments={ownerAppts}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto print:hidden">
             <IntakeForm onAdd={handleAddAppointment} owners={allOwners} />
          </div>
        )}
      </main>
    </div>
  );
}