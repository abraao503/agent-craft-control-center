import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { H } from 'highlight.run'
import { HighlightErrorBoundary } from './components/HighlightErrorBoundary.tsx'
import './i18n'
import { LocaleProvider } from './i18n/LocaleProvider'

// Initialize Highlight only when enabled by environment variable
if (import.meta.env.VITE_HIGHLIGHT_ENABLED === 'true') {
  H.init('mem5yojg', {
    serviceName: 'agent-craft-control-center',
    tracingOrigins: true,
    networkRecording: {
      enabled: true,
      recordHeadersAndBody: true,
    },
  });
}

createRoot(document.getElementById("root")!).render(
  <HighlightErrorBoundary>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </HighlightErrorBoundary>
);
