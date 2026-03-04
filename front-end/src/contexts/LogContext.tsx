import { createContext, useContext, useState, type ReactNode } from 'react';
import type { LogEntry } from '../types';

interface LogContextType {
  logEntries: LogEntry[];
  addLogEntry: (action: LogEntry) => void;
  clearLog: () => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const useLog = () => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useLog must be used within a LogProvider');
  }
  return context;
};

interface LogProviderProps {
  children: ReactNode;
}

export const LogProvider = ({ children }: LogProviderProps) => {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  const addLogEntry = (action: LogEntry) => {
    setLogEntries((prev) => [action, ...prev]);
  };

  const clearLog = () => {
    setLogEntries([]);
  };

  return (
    <LogContext.Provider value={{ logEntries, addLogEntry, clearLog }}>
      {children}
    </LogContext.Provider>
  );
};
