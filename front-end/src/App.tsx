import { PlanViewer } from './components/PlanViewer';
import { ActionLog } from './components/ActionLog';
import { LogProvider } from './contexts/LogContext';
import styles from './App.module.scss';

function App() {
  return (
    <LogProvider>
      <div className={styles.app}>
        <header className={styles.appHeader}>
          <h1>2D Plan Viewer</h1>
          <p>Zoom, pan, and explore plans with real-time action logging</p>
        </header>
        <div className={styles.appContent}>
          <div className={styles.viewerContainer}>
            <PlanViewer />
          </div>
          <ActionLog />
        </div>
      </div>
    </LogProvider>
  );
}

export default App;
