import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/shared/ErrorBoundary.tsx';
import './index.css';

console.log('🚀 [YBBF Debug] React main.tsx initialized.');

window.addEventListener('error', (event) => {
  console.error('🚨 [YBBF Global Window Error]:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 [YBBF Unhandled Promise Rejection]:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

