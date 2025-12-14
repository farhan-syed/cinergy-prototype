import React, { useState } from 'react';
import { Appointment, LocationType, ConfirmationStatus, ToDoItem, TaskStatus } from './types';
import ScheduleTable from './components/ScheduleTable';
import IntakeForm from './components/IntakeForm';
import ToDoList from './components/ToDoList';

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

const INITIAL_TODOS: ToDoItem[] = [];

export default function App() {
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_DATA);
  const [todos, setTodos] = useState<ToDoItem[]>(INITIAL_TODOS);
  const [activeTab, setActiveTab] = useState<'view' | 'intake' | 'todo'>('view');
  
  // Edit Modal State
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const owners = Array.from(new Set(appointments.map(a => a.owner)));
  const allOwners = Array.from(new Set([...owners, 'Cindy', 'Leticia', 'Staff']));

  const handleAddAppointment = (newAppt: Appointment) => {
    setAppointments(prev => [...prev, newAppt]);
    setActiveTab('view');
  };

  const handleUpdateAppointment = (updatedAppt: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === updatedAppt.id ? updatedAppt : a));
    setEditingAppointment(null);
  };

  const handleAddTodo = (text: string, completionTime?: string, sourceAppointmentId?: string, dueDate?: string, assignee: string = 'Me', description: string = '') => {
    // Default to today if no date is provided, using local time
    let finalDueDate = dueDate;
    if (!finalDueDate) {
       const today = new Date();
       const year = today.getFullYear();
       const month = String(today.getMonth() + 1).padStart(2, '0');
       const day = String(today.getDate()).padStart(2, '0');
       finalDueDate = `${year}-${month}-${day}`;
    }

    const newTodo: ToDoItem = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      description,
      status: 'Pending',
      assignee,
      completed: false,
      completionTime,
      dueDate: finalDueDate,
      reminders: [],
      sourceAppointmentId,
      notes: '',
      attachments: []
    };
    setTodos(prev => [newTodo, ...prev]);
  };

  const handleUpdateStatus = (id: string, status: TaskStatus) => {
    setTodos(prev => prev.map(item => 
      item.id === id ? { ...item, status, completed: status === 'Completed' } : item
    ));
  };

  const handleUpdateAssignee = (id: string, assignee: string) => {
    setTodos(prev => prev.map(item => 
      item.id === id ? { ...item, assignee } : item
    ));
  };

  const handleUpdateDescription = (id: string, description: string) => {
    setTodos(prev => prev.map(item => 
      item.id === id ? { ...item, description } : item
    ));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(prev => prev.filter(item => item.id !== id));
  };

  const handleToggleReminder = (id: string, reminderType: string) => {
    setTodos(prev => prev.map(item => {
      if (item.id !== id) return item;
      const reminders = item.reminders || [];
      const exists = reminders.includes(reminderType);
      const newReminders = exists 
        ? reminders.filter(r => r !== reminderType) 
        : [...reminders, reminderType];
      
      return { ...item, reminders: newReminders };
    }));
  };
  
  const handleSetCompletionTime = (id: string, time: string) => {
    setTodos(prev => prev.map(item => 
      item.id === id ? { ...item, completionTime: time } : item
    ));
  };

  const handleSetDueDate = (id: string, date: string) => {
     setTodos(prev => prev.map(item => 
      item.id === id ? { ...item, dueDate: date } : item
    ));
  };

  const handleUpdateNote = (id: string, note: string) => {
    setTodos(prev => prev.map(item =>
      item.id === id ? { ...item, notes: note } : item
    ));
  };

  const handleAddAttachment = (id: string) => {
    setTodos(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newFile = `Document_${(item.attachments?.length || 0) + 1}.pdf`;
      return { ...item, attachments: [...(item.attachments || []), newFile] };
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans print:pb-0 print:bg-white">
      {/* Navbar - Hidden on print */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden no-print">
        <div className="max-w-[95%] mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Cinergy Financial</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 tracking-wide uppercase shadow-sm">
              Prototype
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Main View Toggle */}
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

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* To-Do List Button */}
            <button 
              onClick={() => setActiveTab('todo')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all border ${
                activeTab === 'todo' 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              Tasks
            </button>
          </div>
        </div>
      </header>

      {/* Prototype Disclaimer Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 print:hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
        <div className="max-w-[95%] mx-auto px-6 py-3 flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p className="text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900">Prototype Preview:</span> This is a mostly non-functional prototype programmed to demonstrate the possibilities of an in house software built specifically for Cinergy Financial's needs/workflow.<br /> <u><b>Disregard</b></u> how things look/feel as that can always be changed. 
            </p>
        </div>
      </div>

      <main className="max-w-[95%] mx-auto px-6 py-8 print:w-full print:max-w-none print:p-0">
        
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
                    onEdit={(appt) => setEditingAppointment(appt)}
                  />
                </div>
              );
            })}
          </div>
        ) : activeTab === 'intake' ? (
          <div className="max-w-3xl mx-auto print:hidden">
             <IntakeForm onSubmit={handleAddAppointment} owners={allOwners} />
          </div>
        ) : (
          <div className="print:block">
            <ToDoList 
              items={todos}
              owners={allOwners}
              appointments={appointments}
              onAdd={handleAddTodo}
              onUpdateStatus={handleUpdateStatus}
              onUpdateAssignee={handleUpdateAssignee}
              onUpdateDescription={handleUpdateDescription}
              onDelete={handleDeleteTodo}
              onToggleReminder={handleToggleReminder}
              onSetCompletionTime={handleSetCompletionTime}
              onSetDueDate={handleSetDueDate}
              onUpdateNote={handleUpdateNote}
              onAddAttachment={handleAddAttachment}
            />
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editingAppointment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                 <div>
                    <h3 className="font-bold text-xl text-slate-800">Edit Event</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">Update Details</p>
                 </div>
                 <button 
                   onClick={() => setEditingAppointment(null)} 
                   className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
              </div>
              <div className="p-6">
                <IntakeForm 
                   owners={allOwners}
                   onSubmit={handleUpdateAppointment}
                   initialData={editingAppointment}
                   onCancel={() => setEditingAppointment(null)}
                />
              </div>
           </div>
        </div>
      )}

    </div>
  );
}