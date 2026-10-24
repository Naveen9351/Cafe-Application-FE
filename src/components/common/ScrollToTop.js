import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Immediately scroll window to top upon route or search query change
    window.scrollTo(0, 0);

    if (typeof document !== 'undefined') {
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.scrollTop = 0;
      }
    }
  }, [pathname, search]);

  return null;
}
