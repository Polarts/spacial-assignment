import { useLog } from '../contexts/LogContext';
import styles from './ActionLog.module.scss';

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
};

const actionTypeClassNameMap: Readonly<Record<string, string>> = Object.freeze({
    'zoom-in': 'actionTypeZoomIn',
    'zoom-out': 'actionTypeZoomOut',
    'pan': 'actionTypePan',
    'reset': 'actionTypeReset',
});

const rowClassNameMap: Readonly<Record<string, string>> = Object.freeze({
    'zoom-in': 'logZoomIn',
    'zoom-out': 'logZoomOut',
    'pan': 'logPan',
    'reset': 'logReset',
});

export const ActionLog = () => {
  const { logEntries, clearLog } = useLog();
  return (
    <div className={styles.actionLog}>
      <div className={styles.logHeader}>
        <h2>Action Log</h2>
        <button className={styles.clearBtn} onClick={clearLog}>
          Clear
        </button>
      </div>
      <div className={styles.logTableWrapper}>
        <table className={styles.logTable}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Type</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logEntries.length === 0 ? (
              <tr className={styles.emptyRow}>
                <td colSpan={3}>No actions recorded yet</td>
              </tr>
            ) : (
              logEntries.map((entry, index) => (
                <tr key={index} className={`${styles.logRow} ${styles[rowClassNameMap[entry.actionType]]}`}>
                  <td className={styles.timestamp}>{formatTime(entry.timestamp)}</td>
                  <td className={`${styles.actionType} ${styles[actionTypeClassNameMap[entry.actionType]]}`}>{entry.actionType}</td>
                  <td className={styles.details}>{entry.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.logFooter}>
        Total actions: {logEntries.length}
      </div>
    </div>
  );
};
