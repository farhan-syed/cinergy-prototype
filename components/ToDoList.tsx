import React, { useState } from 'react';
import { ToDoItem, Appointment, TaskStatus } from '../types';

interface ToDoListProps {
  items: ToDoItem[];
  appointments?: Appointment[];
  owners?: string[];
  onAdd: (text: string, completionTime?: string, sourceAppointmentId?: string, dueDate?: string, assignee?: string, description?: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateAssignee: (id: string, assignee: string) => void;
  onUpdateDescription: (id: string, description: string) => void;
  onDelete: (id: string) => void;
  onToggleReminder: (id: string, reminderType: string) => void;
  onSetCompletionTime: (id: string, time: string) => void;
  onSetDueDate: (id: string, date: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onAddAttachment: (id: string) => void;
}

// --- Helpers ---

const getLocalDateString = (d?: Date) => {
  const date = d || new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatCustomDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Select Date';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const [y, m, d] = parts.map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString();
};

const formatInputTime = (val: string): string => {
  if (!val) return '';
  const lower = val.toLowerCase().trim();
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
  
  if (m >= 60 || h > 24) return val;

  let isPm = lower.includes('p');
  let isAm = lower.includes('a');
  if (!isPm && !isAm) {
    if (h === 12) isPm = true;
    else if (h >= 1 && h <= 6) isPm = true;
    else isPm = false; 
  }
  if (h > 12 && h <= 24) { h -= 12; isPm = true; } 
  else if (h === 0) { h = 12; isPm = false; }

  const suffix = isPm ? 'PM' : 'AM';
  return `${h}:${m.toString().padStart(2, '0')} ${suffix}`;
};

const parseScheduleTime = (timeStr: string): string | undefined => {
  if (!timeStr) return undefined;
  return formatInputTime(timeStr);
};

const getInitials = (name: string) => {
  if (!name) return '?';
  if (name === 'Me') return 'ME';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const STATUS_CONFIG: Record<TaskStatus, { bg: string, text: string, border: string, dotColor: string }> = {
    'Pending': { 
      bg: 'bg-white', text: 'text-slate-600', border: 'border-slate-200', dotColor: 'bg-slate-400'
    },
    'In Progress': { 
      bg: 'bg-white', text: 'text-blue-700', border: 'border-blue-200', dotColor: 'bg-blue-500'
    },
    'On Hold': { 
      bg: 'bg-white', text: 'text-orange-700', border: 'border-orange-200', dotColor: 'bg-orange-500'
    },
    'Completed': { 
      bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-200', dotColor: 'bg-green-500'
    },
};

type DateFilterType = 'today' | 'tomorrow' | 'week' | 'all' | 'custom';

// --- Main Component ---

const ToDoList: React.FC<ToDoListProps> = ({ 
    items, 
    appointments = [], 
    owners = [],
    onAdd, 
    onUpdateStatus, 
    onUpdateAssignee, 
    onUpdateDescription,
    onDelete, 
    onToggleReminder, 
    onSetCompletionTime, 
    onSetDueDate, 
    onUpdateNote, 
    onAddAttachment 
}) => {
  // Form State
  const [inputValue, setInputValue] = useState('');
  const [inputDescription, setInputDescription] = useState('');
  const [inputAssignee, setInputAssignee] = useState('Me');
  const [timeValue, setTimeValue] = useState('');
  const [dateValue, setDateValue] = useState(getLocalDateString());
  
  // Filter State
  const [viewingUser, setViewingUser] = useState('All'); 
  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');
  const [customDateFilter, setCustomDateFilter] = useState(getLocalDateString());
  
  // View State
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Import State
  const [isImporting, setIsImporting] = useState(false);
  const [importStep, setImportStep] = useState<'select' | 'configure'>('select');
  const [selectedImportIds, setSelectedImportIds] = useState<Set<string>>(new Set());
  
  // Store per-item configuration for import
  const [importConfigs, setImportConfigs] = useState<Record<string, { assignee: string, dueDate: string }>>({});
  
  // Visibility State
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Derived Lists
  const allAssignees = Array.from(new Set(['Me', 'Cindy', 'Leticia', 'Staff', ...owners]));
  const importedIds = new Set(items.map(i => i.sourceAppointmentId).filter(Boolean));

  // --- Handlers ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      const finalTime = timeValue ? formatInputTime(timeValue) : undefined;
      onAdd(inputValue.trim(), finalTime, undefined, dateValue, inputAssignee, inputDescription.trim());
      setInputValue('');
      setInputDescription('');
      setInputAssignee('Me');
      setTimeValue('');
      setShowCreateForm(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const handleImportNext = () => {
     if (selectedImportIds.size > 0) {
         setImportStep('configure');
         // Initialize configs for selected items
         const initialConfigs: Record<string, { assignee: string, dueDate: string }> = {};
         const defaultDate = getLocalDateString();
         selectedImportIds.forEach(id => {
             initialConfigs[id] = { assignee: 'Me', dueDate: defaultDate };
         });
         setImportConfigs(initialConfigs);
     }
  };

  const handleBatchAssigneeChange = (val: string) => {
      setImportConfigs(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(key => {
              next[key].assignee = val;
          });
          return next;
      });
  };

  const handleBatchDateChange = (val: string) => {
      setImportConfigs(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(key => {
              next[key].dueDate = val;
          });
          return next;
      });
  };

  const handleIndividualConfigChange = (id: string, field: 'assignee' | 'dueDate', val: string) => {
      setImportConfigs(prev => ({
          ...prev,
          [id]: {
              ...prev[id],
              [field]: val
          }
      }));
  };

  const handleImportFinalize = () => {
    appointments.forEach(appt => {
      if (selectedImportIds.has(appt.id)) {
        const config = importConfigs[appt.id];
        onAdd(
            appt.clientName, 
            parseScheduleTime(appt.time), 
            appt.id, 
            config?.dueDate || getLocalDateString(), 
            config?.assignee || 'Me', 
            appt.description || ''
        );
      }
    });
    // Reset
    setIsImporting(false);
    setImportStep('select');
    setSelectedImportIds(new Set());
    setImportConfigs({});
    setShowCreateForm(false);
  };

  const handleCancelImport = () => {
      setIsImporting(false);
      setImportStep('select');
      setSelectedImportIds(new Set());
      setImportConfigs({});
  }

  // --- Filtering Logic ---

  const today = new Date();
  const todayStr = getLocalDateString(today);

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrow);
  
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  const nextWeekStr = getLocalDateString(nextWeek);

  const filteredItems = items.filter(item => {
    if (viewingUser !== 'All' && item.assignee !== viewingUser) return false;

    if (dateFilter === 'all') return true;
    
    if (!item.dueDate) return false;

    if (dateFilter === 'today') {
       return item.dueDate <= todayStr;
    }
    if (dateFilter === 'tomorrow') return item.dueDate === tomorrowStr;
    if (dateFilter === 'week') return item.dueDate >= todayStr && item.dueDate <= nextWeekStr;
    if (dateFilter === 'custom') return item.dueDate === customDateFilter;

    return true;
  });

  // Sort: Non-completed first, then completed at bottom
  filteredItems.sort((a, b) => {
      const aDone = a.status === 'Completed';
      const bDone = b.status === 'Completed';
      if (aDone === bDone) return 0;
      return aDone ? 1 : -1;
  });

  const shouldGroup = dateFilter === 'week' || dateFilter === 'all';
  
  const groupedItems: Record<string, ToDoItem[]> = {};
  if (shouldGroup) {
      filteredItems.forEach(item => {
        const key = item.dueDate || 'No Date';
        if (!groupedItems[key]) groupedItems[key] = [];
        groupedItems[key].push(item);
      });
  } else {
      groupedItems['current'] = filteredItems;
  }

  const groupKeys = Object.keys(groupedItems).sort((a, b) => {
    if (a === 'No Date') return 1;
    if (b === 'No Date') return -1;
    if (a === 'current') return -1;
    return a.localeCompare(b);
  });

  const getGroupTitle = (key: string) => {
    if (key === 'current') return ''; 
    if (key === 'No Date') return 'No Due Date';
    if (key === todayStr) return 'Today';
    if (key === tomorrowStr) return 'Tomorrow';
    
    // Attempt to parse local date for title
    const [y, m, d] = key.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (isNaN(dateObj.getTime())) return key;

    return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const activeCount = filteredItems.filter(i => i.status !== 'Completed').length;
  const completedCount = filteredItems.filter(i => i.status === 'Completed').length;

  return (
    <div className="w-full">
      
      {/* --- Top Controls Dashboard --- */}
      <div className="mb-6 space-y-4">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
             <div>
                 <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Tasks</h2>
                 <p className="text-sm text-slate-500">Manage and track assignments across the organization.</p>
             </div>
             
             {/* Quick Filters */}
             <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                 <button 
                   onClick={() => setViewingUser('Me')}
                   className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewingUser === 'Me' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                 >
                   My Tasks
                 </button>
                 <button 
                   onClick={() => setViewingUser('All')}
                   className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewingUser === 'All' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                 >
                   All Team
                 </button>
                 <div className="h-4 w-px bg-slate-200 mx-1"></div>
                 <select 
                    value={allAssignees.includes(viewingUser) ? viewingUser : ''}
                    onChange={(e) => setViewingUser(e.target.value || 'All')}
                    className="text-sm border-none bg-transparent py-1 pl-2 pr-8 text-slate-600 focus:ring-0 cursor-pointer hover:text-slate-900"
                 >
                    <option value="" disabled>Specific Person...</option>
                    {allAssignees.filter(u => u !== 'Me').map(u => (
                        <option key={u} value={u}>{u}</option>
                    ))}
                 </select>
             </div>
         </div>

         {/* Date Tabs */}
         <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-1">
             <div className="flex items-center gap-6">
                 <button onClick={() => setDateFilter('today')} className={`whitespace-nowrap pb-3 text-sm font-medium border-b-2 transition-colors ${dateFilter === 'today' ? 'border-cinergy-600 text-cinergy-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    Today <span className="ml-1.5 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">{items.filter(i => i.dueDate <= todayStr && i.status !== 'Completed').length}</span>
                 </button>
                 <button onClick={() => setDateFilter('tomorrow')} className={`whitespace-nowrap pb-3 text-sm font-medium border-b-2 transition-colors ${dateFilter === 'tomorrow' ? 'border-cinergy-600 text-cinergy-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    Tomorrow
                 </button>
                 <button onClick={() => setDateFilter('week')} className={`whitespace-nowrap pb-3 text-sm font-medium border-b-2 transition-colors ${dateFilter === 'week' ? 'border-cinergy-600 text-cinergy-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    Next 7 Days
                 </button>
                 <div className="relative group">
                    <button className={`whitespace-nowrap pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${dateFilter === 'custom' ? 'border-cinergy-600 text-cinergy-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        {dateFilter === 'custom' ? formatCustomDateDisplay(customDateFilter) : 'Select Date'}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </button>
                    <input 
                       type="date" 
                       value={customDateFilter}
                       onChange={(e) => {
                           if (e.target.value) {
                              setCustomDateFilter(e.target.value);
                              setDateFilter('custom');
                           }
                       }}
                       className="absolute inset-0 z-10 opacity-0 w-full h-full cursor-pointer" 
                    />
                 </div>
                 <button onClick={() => setDateFilter('all')} className={`whitespace-nowrap pb-3 text-sm font-medium border-b-2 transition-colors ${dateFilter === 'all' ? 'border-cinergy-600 text-cinergy-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    All Tasks
                 </button>
             </div>
             
             {!showCreateForm && (
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-md shadow-sm text-xs transition-all flex items-center gap-2 mb-2 sm:mb-1"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Create Task
                </button>
             )}
         </div>
      </div>

      {/* --- Add Task Form (Conditional) --- */}
      {showCreateForm && (
        <div className="mb-8 bg-white rounded-lg border-2 border-cinergy-300 shadow-sm p-6 relative animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Create New Task</h3>
                <div className="flex items-center gap-4">
                    {!isImporting && appointments.length > 0 && (
                        <button onClick={() => { setIsImporting(true); setImportStep('select'); }} className="text-xs text-cinergy-600 hover:text-cinergy-800 font-bold hover:underline">
                            Import from Schedule
                        </button>
                    )}
                    <button 
                        onClick={() => { setShowCreateForm(false); setIsImporting(false); }} 
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="Close Form"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>

            {isImporting ? (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    
                    {importStep === 'select' && (
                      <div className="flex flex-col max-h-[500px]">
                          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                              <h4 className="text-xs font-bold text-slate-700 uppercase">Select Items to Import</h4>
                              <div className="flex gap-2">
                                  <button onClick={handleCancelImport} className="text-xs font-medium text-slate-500 hover:text-slate-700">Cancel</button>
                                  <button 
                                    onClick={handleImportNext} 
                                    disabled={selectedImportIds.size === 0}
                                    className="px-3 py-1 text-xs font-bold text-white bg-cinergy-600 rounded hover:bg-cinergy-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                      Next ({selectedImportIds.size})
                                  </button>
                              </div>
                          </div>
                          <div className="p-4 overflow-y-auto space-y-2 flex-1">
                              {appointments.map(appt => (
                                  <div 
                                      key={appt.id} 
                                      onClick={() => !importedIds.has(appt.id) && setSelectedImportIds(prev => {
                                          const s = new Set(prev);
                                          s.has(appt.id) ? s.delete(appt.id) : s.add(appt.id);
                                          return s;
                                      })}
                                      className={`flex items-center gap-3 p-2 rounded cursor-pointer border ${selectedImportIds.has(appt.id) ? 'border-cinergy-500 bg-cinergy-50' : 'border-transparent hover:bg-slate-50'} ${importedIds.has(appt.id) ? 'opacity-50' : ''}`}
                                  >
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selectedImportIds.has(appt.id) ? 'bg-cinergy-600 border-cinergy-600 text-white' : 'border-slate-300'}`}>
                                          {selectedImportIds.has(appt.id) && <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12" strokeWidth="4"/></svg>}
                                      </div>
                                      <div className="text-sm">
                                          <span className="font-bold mr-2 text-slate-700">{appt.time}</span>
                                          <span className="font-medium text-slate-900">{appt.clientName}</span>
                                          {appt.description && <span className="block text-xs text-slate-500 truncate">{appt.description}</span>}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                    )}

                    {importStep === 'configure' && (
                        <div className="flex flex-col">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                              <h4 className="text-xs font-bold text-slate-700 uppercase">Configure Import</h4>
                              <button onClick={() => setImportStep('select')} className="text-xs font-medium text-slate-500 hover:text-slate-700">Back</button>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Batch Actions */}
                                <div className="bg-slate-50/80 rounded-lg p-4 border border-blue-200 shadow-sm">
                                  <h5 className="text-sm font-bold text-slate-800 mb-4">Batch Settings</h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Set All To</label>
                                          <select 
                                              onChange={(e) => handleBatchAssigneeChange(e.target.value)}
                                              className="w-full rounded-md border-slate-300 bg-white text-slate-700 shadow-sm focus:border-cinergy-500 focus:ring-cinergy-500 text-sm py-1.5"
                                              defaultValue=""
                                          >
                                              <option value="" disabled>Select Assignee...</option>
                                              {allAssignees.map(u => <option key={u} value={u}>{u}</option>)}
                                          </select>
                                      </div>
                                      <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Set Date</label>
                                          <input 
                                              type="date"
                                              onChange={(e) => handleBatchDateChange(e.target.value)}
                                              className="w-full rounded-md border-slate-300 bg-white text-slate-700 shadow-sm focus:border-cinergy-500 focus:ring-cinergy-500 text-sm py-1.5"
                                          />
                                      </div>
                                  </div>
                                </div>
                                
                                <div>
                                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Selected Items ({selectedImportIds.size})</h5>
                                    <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                                        {appointments.filter(a => selectedImportIds.has(a.id)).map(appt => {
                                            const config = importConfigs[appt.id] || { assignee: 'Me', dueDate: '' };
                                            return (
                                                <div key={appt.id} className="p-3 text-sm text-slate-700 flex flex-col sm:flex-row sm:items-center gap-3 bg-white">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-slate-900 truncate">{appt.clientName}</div>
                                                        <div className="text-xs text-slate-500">{appt.time} • {appt.description || 'No details'}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <select 
                                                            value={config.assignee}
                                                            onChange={(e) => handleIndividualConfigChange(appt.id, 'assignee', e.target.value)}
                                                            className="text-xs rounded border-slate-200 shadow-sm focus:border-cinergy-500 focus:ring-cinergy-500 py-1.5 bg-white text-slate-700"
                                                        >
                                                            {allAssignees.map(u => <option key={u} value={u}>{u}</option>)}
                                                        </select>
                                                        <input 
                                                            type="date"
                                                            value={config.dueDate}
                                                            onChange={(e) => handleIndividualConfigChange(appt.id, 'dueDate', e.target.value)}
                                                            className="text-xs rounded border-slate-200 shadow-sm focus:border-cinergy-500 focus:ring-cinergy-500 py-1.5 bg-white text-slate-700 w-32"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button 
                                      onClick={handleImportFinalize}
                                      className="bg-cinergy-600 hover:bg-cinergy-700 text-white font-bold py-2 px-6 rounded-md shadow-sm text-sm transition-all"
                                    >
                                        Confirm Import
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-8 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Task Title</label>
                                <input 
                                  type="text" 
                                  value={inputValue} 
                                  onChange={(e) => setInputValue(e.target.value)} 
                                  placeholder="e.g., Prepare Monthly Report" 
                                  className="w-full rounded-md border border-slate-200 bg-white text-slate-900 shadow-sm focus:border-cinergy-500 focus:ring-cinergy-500 py-2.5 px-3 text-sm placeholder-slate-400 font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Context / Details</label>
                                <textarea 
                                  value={inputDescription} 
                                  onChange={(e) => setInputDescription(e.target.value)} 
                                  placeholder="Optional context..." 
                                  rows={12}
                                  className="w-full rounded-md border border-slate-200 bg-white text-slate-900 shadow-sm focus:border-cinergy-500 focus:ring-cinergy-500 py-2.5 px-3 text-sm placeholder-slate-400 resize-none"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-4 flex flex-col gap-4 h-full">
                            {/* Assignee Pill - Light Version */}
                            <div className="relative">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Assign To</label>
                                <div className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-3 py-2.5 rounded-md shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-[10px] font-bold">
                                        {getInitials(inputAssignee)}
                                    </div>
                                    <span className="text-sm font-bold pr-1 flex-1">{inputAssignee}</span>
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                                <select 
                                    value={inputAssignee}
                                    onChange={(e) => setInputAssignee(e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer top-5"
                                >
                                    {allAssignees.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>

                            {/* Due Date & Time Group */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Due Date</label>
                                    <div className="flex items-center bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden h-[42px]">
                                        <input 
                                            type="date"
                                            value={dateValue}
                                            onChange={(e) => setDateValue(e.target.value)}
                                            className="border-none py-1 pl-3 pr-1 text-sm text-slate-700 focus:ring-0 bg-transparent h-full w-full cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Time <span className="text-slate-300 font-normal normal-case">(Optional)</span></label>
                                    <div className="flex items-center bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden h-[42px]">
                                        <input 
                                            type="text"
                                            value={timeValue}
                                            onChange={(e) => setTimeValue(e.target.value)}
                                            onBlur={() => setTimeValue(formatInputTime(timeValue))}
                                            placeholder="End of Day"
                                            className="border-none py-1 pl-3 pr-1 text-sm text-slate-700 focus:ring-0 bg-transparent h-full w-full placeholder-slate-400"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1"></div>

                            <div className="flex justify-end pt-2">
                                <button 
                                  type="submit" 
                                  disabled={!inputValue.trim()}
                                  className={`font-bold py-2.5 px-8 rounded-md shadow-sm text-sm transition-all ${!inputValue.trim() ? 'bg-slate-300 text-slate-500 opacity-50 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                >
                                    Create Task
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            )}
        </div>
      )}

      {/* --- Main Task Table --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         {/* Table Header */}
         <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
             <div className="col-span-2">Status</div>
             <div className="col-span-4 md:col-span-5">Task & Context</div>
             <div className="col-span-3 md:col-span-2">Assigned To</div>
             <div className="col-span-3 md:col-span-2 text-right">Due Date</div>
             <div className="hidden md:block col-span-1 text-center"></div>
         </div>

         <div className="divide-y divide-slate-100">
             {filteredItems.length === 0 ? (
                 <div className="p-12 text-center">
                     <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4 text-slate-400">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                     </div>
                     <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
                     <p className="text-slate-500 text-sm mt-1">No tasks matching current filters.</p>
                 </div>
             ) : (
                groupKeys.map(groupKey => (
                    <React.Fragment key={groupKey}>
                        {getGroupTitle(groupKey) && (
                            <div className="px-6 py-2 bg-slate-50/80 border-y border-slate-100 text-xs font-bold text-slate-500 uppercase">
                                {getGroupTitle(groupKey)}
                            </div>
                        )}
                        
                        {groupedItems[groupKey].map(item => {
                            const isExpanded = expandedIds.has(item.id);
                            const style = STATUS_CONFIG[item.status];
                            const initials = getInitials(item.assignee);
                            
                            // Check if overdue
                            const isOverdue = item.dueDate < todayStr && item.status !== 'Completed';

                            return (
                                <React.Fragment key={item.id}>
                                    <div className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group ${isExpanded ? 'bg-slate-50' : ''}`}>
                                        
                                        {/* Status */}
                                        <div className="col-span-2">
                                            <div className="relative group/status inline-block">
                                                 <button 
                                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm ${style.bg} ${style.border} ${style.text}`}
                                                 >
                                                    <div className={`w-2 h-2 rounded-full ${style.dotColor}`}></div>
                                                    <span className="hidden xl:inline">{item.status}</span>
                                                 </button>
                                                 <select
                                                    value={item.status}
                                                    onChange={(e) => onUpdateStatus(item.id, e.target.value as TaskStatus)}
                                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                                 >
                                                     {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                                                 </select>
                                            </div>
                                        </div>

                                        {/* Task Details */}
                                        <div className="col-span-4 md:col-span-5 pr-4 cursor-pointer" onClick={() => toggleExpand(item.id)}>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-sm font-bold ${item.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                                    {item.text}
                                                </span>
                                                {item.sourceAppointmentId && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            alert(`Opening Redtail CRM for ${item.text}`);
                                                        }}
                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 hover:border-red-200 text-[10px] font-semibold transition-colors uppercase tracking-wide"
                                                        title="View in Redtail CRM"
                                                    >
                                                        Redtail
                                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                                    </button>
                                                )}
                                            </div>
                                            {item.description && !isExpanded && (
                                                <div className="text-xs text-slate-500 truncate max-w-md mt-0.5">
                                                    {item.description}
                                                </div>
                                            )}
                                        </div>

                                        {/* Assignee */}
                                        <div className="col-span-3 md:col-span-2">
                                            <div className="flex items-center gap-2 relative group/assignee cursor-pointer">
                                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold border border-slate-700">
                                                    {initials}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{item.assignee}</span>
                                                <select
                                                    value={item.assignee}
                                                    onChange={(e) => onUpdateAssignee(item.id, e.target.value)}
                                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                                >
                                                    {allAssignees.map(u => <option key={u} value={u}>{u}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Due Date (Editable) */}
                                        <div className="col-span-3 md:col-span-2 text-right relative group/date">
                                            <div className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                                                {item.completionTime || 'End of Day'}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium group-hover/date:text-blue-500 group-hover/date:underline cursor-pointer">
                                                {item.dueDate === todayStr ? 'Today' : item.dueDate}
                                            </div>
                                            
                                            {/* Hidden Date Inputs for modification */}
                                            <input 
                                                type="date"
                                                value={item.dueDate}
                                                onChange={(e) => onSetDueDate(item.id, e.target.value)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="hidden md:block col-span-1 text-center">
                                            <button 
                                              onClick={() => toggleExpand(item.id)}
                                              className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors mx-auto ${isExpanded ? 'bg-slate-200 text-slate-600' : 'bg-slate-100'}`}
                                            >
                                                <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details Pane */}
                                    {isExpanded && (
                                        <div className="px-6 py-6 bg-slate-50 border-b border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-8 shadow-inner relative">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Notes</label>
                                                    <textarea 
                                                      value={item.description || ''} 
                                                      onChange={(e) => onUpdateDescription(item.id, e.target.value)}
                                                      className="w-full text-sm rounded-md border-slate-200 bg-white text-slate-700 focus:ring-cinergy-500 focus:border-cinergy-500 shadow-sm min-h-[120px]" 
                                                      placeholder="Add details and context..." 
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Quick Actions</label>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        {['10m', '1h', '1d'].map(t => (
                                                            <button 
                                                              key={t}
                                                              onClick={() => onToggleReminder(item.id, t)}
                                                              className={`px-3 py-1.5 text-xs font-medium rounded-md border shadow-sm transition-colors ${item.reminders.includes(t) ? 'bg-cinergy-600 text-white border-cinergy-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                                                            >
                                                                Remind {t}
                                                            </button>
                                                        ))}
                                                        <div className="flex-1 text-right">
                                                            <button onClick={() => onDelete(item.id)} className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline">
                                                                Delete Task
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Attachments</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.attachments?.map((f, i) => (
                                                            <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-600 shadow-sm">
                                                                <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/></svg>
                                                                {f}
                                                            </div>
                                                        ))}
                                                        <button onClick={() => onAddAttachment(item.id)} className="text-xs text-cinergy-600 hover:text-cinergy-800 font-medium flex items-center gap-1 px-2 py-1.5">
                                                            <span className="text-lg leading-none">+</span> Add File
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </React.Fragment>
                ))
             )}
         </div>

         {/* Footer / Summary */}
         <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between text-xs text-slate-500 font-medium">
             <div>
                 Showing {filteredItems.length} tasks
             </div>
             <div className="flex gap-4">
                 <span>Active: {activeCount}</span>
                 <span>Completed: {completedCount}</span>
             </div>
         </div>
      </div>
    </div>
  );
};

export default ToDoList;