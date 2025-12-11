
import React, { useState } from 'react';
import { ToDoItem, Appointment } from '../types';

interface ToDoListProps {
  items: ToDoItem[];
  appointments?: Appointment[];
  onAdd: (text: string, completionTime?: string, sourceAppointmentId?: string, dueDate?: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleReminder: (id: string, reminderType: string) => void;
  onSetCompletionTime: (id: string, time: string) => void;
  onSetDueDate: (id: string, date: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onAddAttachment: (id: string) => void;
}

// Helper to format loose time input into "H:MM AM/PM"
const formatInputTime = (val: string): string => {
  if (!val) return '';
  const lower = val.toLowerCase().trim();
  
  // Remove non-digits
  const digits = lower.replace(/[^0-9]/g, '');
  if (!digits) return val;
  
  let h = 0, m = 0;
  
  if (digits.length <= 2) {
    h = parseInt(digits, 10);
  } else if (digits.length === 3) {
    h = parseInt(digits.substring(0, 1), 10);
    m = parseInt(digits.substring(1), 10);
  } else {
    h = parseInt(digits.substring(0, 2), 10);
    m = parseInt(digits.substring(2, 4), 10);
  }
  
  // Validation bounds
  if (m >= 60 || h > 24) return val;

  let isPm = lower.includes('p');
  let isAm = lower.includes('a');

  // Business Hour Heuristic if no suffix specified
  // 12 -> 12:00 PM
  // 1-6 -> PM
  // 7-11 -> AM
  if (!isPm && !isAm) {
    if (h === 12) isPm = true;
    else if (h >= 1 && h <= 6) isPm = true;
    else isPm = false; // 7-11 and others default to AM
  }

  // Handle 24h input conversion (e.g. 13:00 -> 1:00 PM)
  if (h > 12 && h <= 24) {
    h -= 12;
    isPm = true;
  } else if (h === 0) {
    h = 12;
    isPm = false; // 00:00 -> 12:00 AM
  }

  const suffix = isPm ? 'PM' : 'AM';
  return `${h}:${m.toString().padStart(2, '0')} ${suffix}`;
};

// Update parseScheduleTime to return formatted AM/PM string instead of 24h
const parseScheduleTime = (timeStr: string): string | undefined => {
  if (!timeStr) return undefined;
  return formatInputTime(timeStr);
};

// Helper to sort and group items
const groupItems = (items: ToDoItem[]) => {
  const groups: Record<string, ToDoItem[]> = {};
  
  items.forEach(item => {
    // If completed, maybe show at bottom or separate? For now keep in groups
    const key = item.dueDate || 'No Date';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  return groups;
};

const getGroupLabel = (dateStr: string) => {
  if (dateStr === 'No Date') return 'No Due Date';
  
  const d = new Date(dateStr + 'T00:00:00'); // Append time to force local day interpretation
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const tomStr = tomorrow.toISOString().split('T')[0];

  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomStr) return 'Tomorrow';

  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

const ToDoList: React.FC<ToDoListProps> = ({ items, appointments = [], onAdd, onToggle, onDelete, onToggleReminder, onSetCompletionTime, onSetDueDate, onUpdateNote, onAddAttachment }) => {
  const [inputValue, setInputValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [dateValue, setDateValue] = useState(new Date().toISOString().split('T')[0]);
  const [viewingUser, setViewingUser] = useState('Me');
  
  // Import Mode State
  const [isImporting, setIsImporting] = useState(false);
  const [selectedImportIds, setSelectedImportIds] = useState<Set<string>>(new Set());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // Format time before adding if user didn't trigger blur
      const finalTime = timeValue ? formatInputTime(timeValue) : undefined;
      onAdd(inputValue.trim(), finalTime, undefined, dateValue);
      setInputValue('');
      setTimeValue('');
      setDateValue(new Date().toISOString().split('T')[0]); // Reset to today
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
        
        // Try to parse the time from the schedule string (e.g. "9:00")
        const completionTime = parseScheduleTime(appt.time);
        
        onAdd(text, completionTime, appt.id);
      }
    });
    setIsImporting(false);
    setSelectedImportIds(new Set());
  };

  // Group appointments by owner for import
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

  // Group items for display
  const groupedItems = groupItems(items);
  // Sort keys: Dates ascending, then 'No Date' last
  const sortedKeys = Object.keys(groupedItems).sort((a, b) => {
    if (a === 'No Date') return 1;
    if (b === 'No Date') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="max-w-3xl mx-auto print:w-full print:max-w-none">
      {/* User View Selector - Positioned above the card with specific width and spacing */}
      <div className="mb-4">
        <div className="relative inline-block text-left">
           <select
              value={viewingUser}
              onChange={(e) => setViewingUser(e.target.value)}
              className="appearance-none block w-48 rounded-lg border-0 bg-white py-2 pl-3 pr-10 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-cinergy-600 sm:text-sm sm:leading-6 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <option value="Me">View: My Tasks</option>
              <option value="Cindy">View: Cindy</option>
              <option value="Leticia">View: Leticia</option>
              <option value="Kobe">View: Kobe</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                </svg>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-slate-300 relative">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:bg-slate-100 print:border-slate-300">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {viewingUser === 'Me' ? 'My Tasks' : `${viewingUser}'s Tasks`}
            </h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">ACTIVITY TRACKER</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {!isImporting && appointments.length > 0 && (
               <button 
                 onClick={() => setIsImporting(true)}
                 className="text-sm text-cinergy-600 hover:text-cinergy-800 font-medium underline underline-offset-2 decoration-transparent hover:decoration-cinergy-600 transition-all print:hidden"
               >
                 Import Schedule
               </button>
            )}
            <div className="text-sm text-slate-500 font-medium hidden sm:block">
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
                    placeholder={viewingUser === 'Me' ? "what needs to be done?" : `Add task for ${viewingUser}...`}
                    className="w-full rounded-md border-slate-200 shadow-sm focus:border-cinergy-500 focus:ring-cinergy-500 text-sm py-2.5 px-4 border bg-white text-slate-700 placeholder-slate-400"
                  />
                </div>
                
                <div className="flex gap-3">
                  <div className="relative border border-slate-200 rounded-md bg-white shadow-sm flex items-center px-3 gap-2" title="Set due date and time">
                    <div className="flex items-center pointer-events-none text-slate-400 mr-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <input 
                      type="text"
                      value={timeValue}
                      onChange={(e) => setTimeValue(e.target.value)}
                      onBlur={(e) => setTimeValue(formatInputTime(e.target.value))}
                      placeholder="00:00 AM"
                      className="border-none focus:ring-0 text-sm py-2 bg-transparent text-slate-700 w-[68px] p-0"
                    />
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    <input 
                      type="date"
                      value={dateValue}
                      onChange={(e) => setDateValue(e.target.value)}
                      className="border-none focus:ring-0 text-sm py-2 bg-transparent text-slate-500 p-0"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 whitespace-nowrap"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </div>

            <div className="divide-y divide-slate-100 print:divide-slate-200">
              {items.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">
                  {viewingUser === 'Me' 
                    ? "No tasks yet. Add one above." 
                    : `No tasks found for ${viewingUser}.`}
                </div>
              ) : (
                sortedKeys.map(dateKey => (
                  <div key={dateKey} className="border-b border-slate-100 last:border-0">
                    <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-100 shadow-sm">
                      {getGroupLabel(dateKey)}
                    </div>
                    <div className="divide-y divide-slate-100">
                      {groupedItems[dateKey].map(item => {
                        // Check if this task is linked to an appointment (and thus a client)
                        const sourceAppt = appointments?.find(a => a.id === item.sourceAppointmentId);
                        
                        return (
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
                                  <div className="flex items-center gap-2">
                                     {/* Redtail CRM Button - Moved to top right */}
                                     {sourceAppt && (
                                        <button 
                                            onClick={(e) => {
                                               e.preventDefault();
                                               alert(`Opening Redtail CRM for ${sourceAppt.clientName}`);
                                            }}
                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 hover:border-red-200 text-[10px] font-semibold transition-colors print:hidden"
                                            title="View in Redtail CRM"
                                        >
                                             Redtail
                                             <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                        </button>
                                     )}

                                    <button
                                        onClick={() => onDelete(item.id)}
                                        className="text-slate-300 hover:text-red-500 ml-1 p-1 opacity-0 group-hover:opacity-100 transition-all print:hidden cursor-pointer"
                                        title="Delete task"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                      </button>
                                  </div>
                                </div>

                                {/* Second Row: Time and Toggles */}
                                {!item.completed && (
                                  <div className="mt-3 flex flex-wrap items-center gap-3">
                                    
                                    {/* Due Date & Time Box */}
                                    <div className="flex items-center gap-2 px-2 py-1 bg-white border border-slate-200 rounded-sm shadow-sm">
                                        <svg className="w-3.5 h-3.5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <span className="text-[11px] font-bold text-slate-800">Due:</span>
                                        
                                        {/* Time Input - Manual Entry */}
                                        <input
                                          type="text"
                                          value={item.completionTime || ''}
                                          onChange={(e) => onSetCompletionTime(item.id, e.target.value)}
                                          onBlur={(e) => onSetCompletionTime(item.id, formatInputTime(e.target.value))}
                                          placeholder="00:00 AM"
                                          className="text-[11px] font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-0 w-[68px] -ml-1"
                                          title="Set due time"
                                        />

                                        {/* Date Input */}
                                        <input
                                          type="date"
                                          value={item.dueDate || ''}
                                          onChange={(e) => onSetDueDate(item.id, e.target.value)}
                                          className="text-[10px] font-medium text-slate-500 bg-transparent border-none focus:ring-0 p-0 w-[80px] -ml-1"
                                          title="Set due date"
                                        />
                                    </div>

                                    {/* Reminder Section */}
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">REMIND ME:</span>
                                      {['1d', '1h', '10m'].map(time => {
                                        const isActive = (item.reminders || []).includes(time);
                                        return (
                                          <button
                                            key={time}
                                            onClick={() => onToggleReminder(item.id, time)}
                                            className={`px-2 py-1 rounded-sm text-[10px] font-bold border transition-all cursor-pointer ${
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
                                  </div>
                                )}

                                {/* Notes Area - Always visible for active tasks */}
                                {!item.completed && (
                                  <div className="mt-3">
                                    <textarea
                                      value={item.notes || ''}
                                      onChange={(e) => onUpdateNote(item.id, e.target.value)}
                                      placeholder="Add notes..."
                                      className="w-full text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-cinergy-500 focus:border-cinergy-500 min-h-[60px]"
                                    />
                                  </div>
                                )}

                                {/* Integrations and Files */}
                                {!item.completed && (
                                  <div className="mt-2 flex items-center gap-2">
                                      {/* File Attachment Button */}
                                      <button
                                        onClick={() => onAddAttachment(item.id)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-medium transition-colors border border-slate-200 active:scale-95"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                        Attach files
                                      </button>
                                  </div>
                                )}
                                
                                {/* Attachments List */}
                                {item.attachments && item.attachments.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {item.attachments.map((file, idx) => (
                                      <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600">
                                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                        <span className="max-w-[150px] truncate">{file}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                      );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ToDoList;
