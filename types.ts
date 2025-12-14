
export enum LocationType {
  ZOOM = 'Zoom',
  OFC = 'OFC', // Office
  PH = 'PH', // Phone
  HOUSE = 'HOUSE'
}

export enum ConfirmationStatus {
  Y = 'Y',
  N = 'N',
  LM = 'LM | Sent Email',
  MSG = 'Left Msg'
}

export type TaskStatus = 'Pending' | 'In Progress' | 'On Hold' | 'Completed';

export interface Appointment {
  id: string;
  owner: string; // e.g., "Cindy", "Leticia", "Staff"
  time: string;
  clientName: string;
  description: string; // The text below the name
  lastAcctSummary?: string;
  rmdCheck?: boolean; // RMD 70 1/2
  phone: string;
  email?: string;
  location: LocationType | string;
  zoomLink?: string; // Optional link for Zoom meetings
  zoomLinkSent?: boolean; // Tracks if the link was emailed
  confirmation: ConfirmationStatus | string;
  dppsValue?: string; // Available for DPPs
  ifsValue?: string; // Available for IFs
  notes?: string; // Internal notes
}

export interface DaySchedule {
  date: string;
  appointments: Appointment[];
}

export interface ToDoItem {
  id: string;
  text: string;
  description?: string; // Context/Description of the task
  status: TaskStatus;
  assignee: string; // 'Me', 'Cindy', etc.
  completed: boolean; // Kept for backward compat, synced with status === 'Completed'
  completionTime?: string; // HH:mm format
  dueDate?: string; // YYYY-MM-DD
  reminders: string[]; // Array of active reminders: '1d', '1h', '10m'
  reminderDate?: string; // YYYY-MM-DD
  sourceAppointmentId?: string; // ID of the appointment if imported from schedule
  notes?: string; // Additional running notes/updates
  attachments?: string[];
}
