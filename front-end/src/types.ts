export interface LogEntry {
  timestamp: Date;
  actionType: 'zoom-in' | 'zoom-out' | 'pan' | 'reset';
  details: string;
}
