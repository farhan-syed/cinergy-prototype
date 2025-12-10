
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
}

export interface DaySchedule {
  date: string;
  appointments: Appointment[];
}

export interface ToDoItem {
  id: string;
  text: string;
  completed: boolean;
  completionTime?: string; // HH:mm format, time the item needs to be completed
  reminders: string[]; // Array of active reminders: '1h', '30m', '10m'
  sourceAppointmentId?: string; // ID of the appointment if imported from schedule
}
