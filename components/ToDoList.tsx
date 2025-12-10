
import React, { useState } from 'react';
import { ToDoItem, Appointment } from '../types';

interface ToDoListProps {
  items: ToDoItem[];
  appointments?: Appointment[];
  onAdd: (text: string, completionTime?: string, sourceAppointmentId?: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleReminder: (id: string, reminderType: string) => void;
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
};

// Helper to guess 24h format from loose schedule time (e.g. "1:00" -> "13:00")
const parseScheduleTime = (timeStr: string): string | undefined => {
  if (!timeStr) return undefined;
  const lower = timeStr.toLowerCase().trim();
  const cleanStr = lower.replace(/[^0-9:]/g, ''); 
  const parts = cleanStr.split(':');
  let h = parseInt(parts[0], 10);
  let m = parts[1] ? parseInt(parts[1], 10) : 0;
  
  if (isNaN(h)) return undefined;

  // Simple heuristic matching ScheduleTable
  let isPm = false;
  if (lower.includes('p') || lower.includes('pm')) isPm = true;
  else if (lower.includes('a') || lower.includes('am')) isPm = false;
  else {
    // 12 is PM, 1-6 is PM, 7-11 is AM
    if (h === 12 || (h >= 1 && h <= 6)) isPm = true;
  }

  if (isPm && h !== 12) h += 12;
  if (!isPm && h === 12) h = 0;

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const ToDoList: React.FC<ToDoListProps> = ({ items, appointments = [], onAdd, onToggle, onDelete, onToggleReminder }) => {
  const [inputValue, setInputValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  
  // Import Mode State
  const [isImporting, setIsImporting] = useState(false);
  const [selectedImportIds, setSelectedImportIds] = useState<Set<string>>(new Set());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAdd(inputValue.trim(), timeValue || undefined);
      setInputValue('');
      setTimeValue('');
    }
  };

  const handleToggleImportSelection = (id: string) => {
    const newSet = new Set(selectedImportIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedImportIds(newSet);
  };

  const handleImportExecute = () => {
    appointments.forEach(appt => {
      if (selectedImportIds.has(appt.id)) {
        // Text is just the client info now, time is separate
        const text = `${appt.clientName}${appt.description ? ` - ${appt.description}` : ''}`;
        
        // Try to parse the time from the schedule string (e.g. "9:00") to input format "09:00"
        const completionTime = parseScheduleTime(appt.time);
        
        onAdd(text, completionTime, appt.id);
      }
    });
    setIsImporting(false);
    setSelectedImportIds(new Set());
  };

  // Group appointments by owner
  const groupedAppointments = appointments.reduce((groups, appt) => {
    const owner = appt.owner || 'Other';
    if (!groups[owner]) {
      groups[owner] = [];
    }
    groups[owner].push(appt);
    return groups;
  }, {} as Record<string, Appointment[]>);

  const owners = Object.keys(groupedAppointments);

  // Track already imported IDs
  const importedIds = new Set(items.map(i => i.sourceAppointmentId).filter(Boolean));

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-slate-300 print:w-full print:max-w-none relative">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between print:bg-slate-100 print:border-slate-300">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Daily Tasks</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">ACTIVITY TRACKER</p>
        </div>
        <div className="flex items-center gap-4">
          {!isImporting && appointments.length > 0 && (
             <button 
               onClick={() => setIsImporting(true)}
               className="text-sm text-cinergy-600 hover:text-cinergy-800 font-medium underline underline-offset-2 decoration-transparent hover:decoration-cinergy-600 transition-all print:hidden"
             >
               Import Schedule
             </button>
          )}
          <div className="text-sm text-slate-500 font-medium">
            {items.filter(i => i.completed).length} / {items.length} Completed
          </div>
        </div>
      </div>

      {isImporting ? (
        <div className="p-6 bg-slate-50/50 min-h-[200px] animate-in fade-in zoom-in-95 duration-200">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Select Appointments to Import</h3>
            <button 
              onClick={() => setIsImporting(false)} 
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 max-h-[500px] overflow-y-auto shadow-sm">
             {appointments.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm">No appointments available to import.</div>
             ) : (
                <div>
                  {owners.map(owner => (
                    <div key={owner} className="border-b border-slate-100 last:border-0">
                      <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-100 shadow-sm">
                        {owner}
                      </div>
                      <div className="divide-y divide-slate-50">
                        {groupedAppointments[owner].map(appt => {
                          const isImported = importedIds.has(appt.id);
                          return (
                            <div 
                              key={appt.id} 
                              onClick={() => !isImported && handleToggleImportSelection(appt.id)}
                              className={`flex items-start gap-3 p-3 transition-colors ${
                                isImported 
                                  ? 'bg-slate-50 opacity-60 cursor-not-allowed' 
                                  : 'hover:bg-slate-50 cursor-pointer'
                              }`}
                            >
                              <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                                 isImported 
                                  ? 'bg-slate-200 border-slate-200 text-slate-400' 
                                  : selectedImportIds.has(appt.id) 
                                    ? 'bg-cinergy-600 border-cinergy-600 text-white' 
                                    : 'border-slate-300 bg-white'
                              }`}>
                                {isImported ? (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                ) : selectedImportIds.has(appt.id) && (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                )}
                              </div>
                              <div className="text-sm">
                                <span className={`font-semibold mr-2 ${isImported ? 'text-slate-500' : 'text-slate-900'}`}>{appt.time}</span>
                                <span className={isImported ? 'text-slate-500' : 'text-slate-700'}>{appt.clientName}</span>
                                {appt.description && <span className={`block text-xs mt-0.5 ${isImported ? 'text-slate-400' : 'text-slate-500'}`}>{appt.description}</span>}
                                {isImported && <span className="inline-block mt-1 text-[10px] font-medium bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Added</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
             )}
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setIsImporting(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImportExecute}
              disabled={selectedImportIds.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-cinergy-600 hover:bg-cinergy-800 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              Import {selectedImportIds.size} Items
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="p-6 bg-slate-50/30 border-b border-slate-200 print:hidden">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="what needs to be done?"
                  className="w-full rounded-md border-slate-200 shadow-sm focus:border-cinergy-500 focus:ring-cinergy-500 text-sm py-2.5 px-4 border bg-white text-slate-700 placeholder-slate-400"
                />
              </div>
              
              <div className="flex gap-3">
                <div className="relative" title="Set completion time">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <input 
                    type="time"
                    value={timeValue}
                    onChange={(e) => setTimeValue(e.target.value)}
                    className="rounded-md border-slate-200 shadow-sm focus:border-cinergy-500 focus:ring-cinergy-500 text-sm py-2.5 pl-9 pr-3 border bg-white text-slate-700"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-slate-500 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 whitespace-nowrap"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>

          <div className="divide-y divide-slate-100 print:divide-slate-200">
            {items.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic">No tasks yet. Add one above.</div>
            ) : (
              items.map(item => (
                <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors group print:break-inside-avoid">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => onToggle(item.id)}
                      className={`mt-0.5 w-6 h-6 rounded border flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${
                        item.completed 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'bg-white border-slate-300 text-transparent hover:border-cinergy-500'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                         <div className="flex flex-col gap-0.5">
                            <span className={`text-sm font-medium transition-all break-words ${
                              item.completed ? 'text-slate-400 line-through' : 'text-slate-900'
                            }`}>
                              {item.text}
                            </span>
                         </div>
                         <button
                            onClick={() => onDelete(item.id)}
                            className="text-slate-300 hover:text-red-500 ml-2 p-1 opacity-0 group-hover:opacity-100 transition-all print:hidden cursor-pointer"
                            title="Delete task"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                      </div>

                      {/* Second Row: Time and Toggles */}
                      {item.completionTime && (
                        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2">
                          <div className={`flex items-center gap-1.5 text-xs font-semibold ${item.completed ? 'text-slate-300' : 'text-cinergy-700'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span>Due: {formatTime(item.completionTime)}</span>
                          </div>

                          {!item.completed && (
                            <div className="flex items-center gap-2 print:hidden">
                              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Remind me:</span>
                              {['1h', '30m', '10m'].map(time => {
                                const isActive = (item.reminders || []).includes(time);
                                return (
                                  <button
                                    key={time}
                                    onClick={() => onToggleReminder(item.id, time)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                      isActive 
                                        ? 'bg-cinergy-600 text-white border-cinergy-600 shadow-sm' 
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                  >
                                    {time}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ToDoList;
