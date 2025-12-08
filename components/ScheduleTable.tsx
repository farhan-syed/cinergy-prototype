
import React from 'react';
import { Appointment, LocationType } from '../types';

interface ScheduleTableProps {
  owner: string;
  appointments: Appointment[];
}

const processTime = (timeStr: string) => {
  if (!timeStr) return { minutes: 0, label: '' };
  
  const lower = timeStr.toLowerCase().trim();
  const hasAm = lower.includes('am') || lower.includes('a.m.');
  const hasPm = lower.includes('pm') || lower.includes('p.m.');
  
  // Remove non-digit/colon chars for parsing numbers
  const cleanStr = lower.replace(/[^0-9:]/g, ''); 
  const parts = cleanStr.split(':');
  let h = parseInt(parts[0], 10);
  let m = parts[1] ? parseInt(parts[1], 10) : 0;
  
  if (isNaN(h)) return { minutes: 9999, label: timeStr }; // Fallback to end if invalid
  
  let isPm = false;
  
  if (hasPm) {
    isPm = true;
  } else if (hasAm) {
    isPm = false;
  } else {
    // Heuristic for Business Hours if no suffix provided:
    // 12 is PM
    // 1 to 6 is PM
    // 7 to 11 is AM
    if (h === 12) isPm = true;
    else if (h >= 1 && h <= 6) isPm = true;
    else isPm = false;
  }
  
  // Normalize sorting hour (24h format for calculation)
  let sortH = h;
  if (isPm && h !== 12) sortH += 12;
  if (!isPm && h === 12) sortH = 0; // 12 AM is 0:00
  
  const suffix = isPm ? 'PM' : 'AM';
  const mStr = m.toString().padStart(2, '0');
  
  return {
    minutes: sortH * 60 + m,
    label: `${h}:${mStr} ${suffix}`
  };
};

const ScheduleTable: React.FC<ScheduleTableProps> = ({ owner, appointments }) => {
  // Process times for sorting and display
  const processedAppointments = appointments.map(appt => {
    const { minutes, label } = processTime(appt.time);
    return { ...appt, _minutes: minutes, _timeLabel: label };
  });

  // Sort by calculated minutes from midnight (AM to PM)
  const sortedAppointments = processedAppointments.sort((a, b) => a._minutes - b._minutes);

  const handleResend = (e: React.MouseEvent, recipient: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Resend Zoom invitation link to ${recipient}?`)) {
        alert(`Zoom link has been resent to ${recipient}!`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:overflow-visible print:shadow-none print:rounded-none print:border-slate-300">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between print:bg-slate-100 print:border-slate-300">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{owner}</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Daily Appointment Confirmation</p>
        </div>
        <div className="hidden sm:block print:block">
           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cinergy-100 text-cinergy-800 print:bg-slate-200 print:text-slate-800">
             {sortedAppointments.length} Events
           </span>
        </div>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full text-left border-collapse min-w-[1000px] print:min-w-0">
          <thead>
            <tr className="bg-white border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider print:text-slate-700 print:border-slate-300">
              <th className="px-4 py-3 w-20">Time</th>
              <th className="px-4 py-3 w-1/5">Name / Description</th>
              <th className="px-4 py-3 w-28">Date of last Acct. Summary</th>
              <th className="px-4 py-3 w-16 text-center">RMD</th>
              <th className="px-4 py-3 w-32">Phone</th>
              <th className="px-4 py-3 w-40">Email</th>
              <th className="px-4 py-3 w-24">Location</th>
              <th className="px-4 py-3 w-32 text-center">Status</th>
              <th className="px-4 py-3 w-32 bg-slate-50/50 print:bg-transparent">Avail. for DPPs</th>
              <th className="px-4 py-3 w-32 bg-slate-50/50 print:bg-transparent">Avail. for IFs</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 print:divide-slate-200">
            {sortedAppointments.length === 0 ? (
               <tr className="bg-slate-50/30">
                 <td colSpan={10} className="px-6 py-8 text-center text-slate-400 italic">
                   No appointments scheduled for {owner}
                 </td>
               </tr>
            ) : (
              sortedAppointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-slate-50 transition-colors group print:break-inside-avoid">
                  <td className="px-4 py-4 font-semibold text-slate-700 align-top whitespace-nowrap">{appt._timeLabel}</td>
                  
                  <td className="px-4 py-4 align-top">
                    <div className="font-bold text-slate-900 text-base">{appt.clientName}</div>
                    {appt.description && (
                      <div className="text-slate-500 mt-0.5 text-xs print:text-slate-600">{appt.description}</div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-slate-600 align-top text-xs">
                    {appt.lastAcctSummary || '-'}
                  </td>

                  <td className="px-4 py-4 text-center align-top">
                     {appt.rmdCheck && (
                       <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-600 rounded-full text-xs font-bold print:border print:border-green-200">✓</span>
                     )}
                  </td>

                  <td className="px-4 py-4 align-top">
                    <div className="text-slate-600 font-medium text-xs break-words">{appt.phone}</div>
                  </td>
                  
                  <td className="px-4 py-4 align-top">
                    <div className="text-slate-600 font-medium text-xs break-all">{appt.email || '-'}</div>
                  </td>

                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col gap-1 items-start">
                      {appt.location === LocationType.ZOOM ? (
                        <a 
                          href={appt.zoomLink || 'https://zoom.us'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer print:border-blue-300 print:text-blue-800 min-w-[72px] justify-center"
                        >
                          Zoom 
                          <svg className="w-3 h-3 print:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </a>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200 print:bg-white print:border-slate-300">
                          {appt.location}
                        </span>
                      )}

                      {appt.zoomLinkSent && (
                        <button
                          onClick={(e) => handleResend(e, appt.email || appt.clientName)}
                          className="group/resend flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 hover:border-green-300 text-[10px] font-semibold print:bg-green-100 transition-all cursor-pointer min-w-[72px] justify-center mt-0.5"
                          title="Click to resend link"
                        >
                           <span className="flex items-center gap-1 group-hover/resend:hidden">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                              Sent
                           </span>
                           <span className="hidden group-hover/resend:flex items-center gap-1 text-green-800">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                              Resend
                           </span>
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-center align-top">
                    {appt.confirmation && (
                       <span className={`inline-flex items-center justify-center px-2 py-1.5 rounded text-xs font-semibold mx-auto
                         ${appt.confirmation.length > 3 ? 'whitespace-normal text-center leading-tight max-w-[120px]' : 'whitespace-nowrap'}
                         ${appt.confirmation === 'Y' ? 'bg-green-50 text-green-700 border border-green-200 print:bg-green-100 print:border-green-300 print:text-green-900' : ''}
                         ${appt.confirmation === 'N' ? 'bg-red-50 text-red-700 border border-red-200 print:bg-red-100 print:border-red-300 print:text-red-900' : ''}
                         ${!['Y', 'N'].includes(appt.confirmation) ? 'bg-orange-50 text-orange-700 border border-orange-200 print:bg-orange-100 print:border-orange-300 print:text-orange-900' : ''}
                       `}>
                         {appt.confirmation}
                       </span>
                    )}
                  </td>

                  <td className="px-4 py-4 align-top text-slate-700 font-medium bg-slate-50/30 group-hover:bg-slate-100/50 print:bg-transparent">
                    {appt.dppsValue}
                  </td>

                  <td className="px-4 py-4 align-top text-slate-700 font-medium bg-slate-50/30 group-hover:bg-slate-100/50 print:bg-transparent">
                     {appt.ifsValue}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleTable;
