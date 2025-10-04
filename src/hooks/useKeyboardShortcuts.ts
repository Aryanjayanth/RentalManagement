
import { useEffect } from 'react';

interface KeyboardShortcuts {
  onAddTenant?: () => void;
  onAddProperty?: () => void;
  onSearch?: () => void;
  onLogout?: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl (or Cmd on Mac) is pressed
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      
      if (isCtrlOrCmd) {
        switch (event.key.toLowerCase()) {
          case 't':
            event.preventDefault();
            shortcuts.onAddTenant?.();
            break;
          case 'p':
            event.preventDefault();
            shortcuts.onAddProperty?.();
            break;
          case 'k':
            event.preventDefault();
            shortcuts.onSearch?.();
            break;
          case 'q':
            event.preventDefault();
            shortcuts.onLogout?.();
            break;
        }
      }

      // ESC key for closing dialogs/modals
      if (event.key === 'Escape') {
        // This will be handled by individual components
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
