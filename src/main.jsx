import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './workspace.css';
import './pages.css';
import './system-polish.css';
import './requester-black-gold.css';
import './admin-black-gold.css';
import './workspace-motion.css';
import './auth-black-gold.css';

function AppRoot() {
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    let transitionTimer;
    const handleNavigation = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target.closest?.('a[href]');
      if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      event.preventDefault();
      setTransitioning(true);
      transitionTimer = window.setTimeout(() => window.location.assign(destination.href), 280);
    };

    document.addEventListener('click', handleNavigation);
    return () => {
      document.removeEventListener('click', handleNavigation);
      window.clearTimeout(transitionTimer);
    };
  }, []);

  return (
    <>
      <App />
      {transitioning && <div className="page-transition" role="status" aria-label="Opening selected page"><div className="page-transition-logo"><span className="brand-mark">DQ</span><span>DocuQuest</span></div></div>}
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
);