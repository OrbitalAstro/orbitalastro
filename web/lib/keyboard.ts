// Keyboard shortcuts utility
import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  handler: () => void;
}

export const useKeyboardShortcuts = (shortcuts: Record<string, () => void> | ShortcutConfig[]) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer les raccourcis si l'utilisateur est en train de taper dans un champ de saisie
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return; // Ne pas intercepter les événements de saisie
      }

      // Si shortcuts est un tableau d'objets de configuration
      if (Array.isArray(shortcuts)) {
        for (const shortcut of shortcuts) {
          const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
          const metaMatch = shortcut.meta ? (e.metaKey || e.ctrlKey) : true;
          const ctrlMatch = shortcut.ctrl !== undefined ? (e.ctrlKey === shortcut.ctrl) : true;
          const shiftMatch = shortcut.shift !== undefined ? (e.shiftKey === shortcut.shift) : true;

          if (keyMatch && metaMatch && ctrlMatch && shiftMatch) {
            e.preventDefault();
            shortcut.handler();
            return;
          }
        }
      } else {
        // Si shortcuts est un Record simple
        const key = e.key.toLowerCase();
        // Vérifier que shortcuts[key] existe et est une fonction avant de l'appeler
        if (shortcuts[key] && typeof shortcuts[key] === 'function') {
          e.preventDefault();
          shortcuts[key]();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export const keyboard = {
  register: (_key: string, _handler: () => void) => {
    // Stub implementation
  },
  unregister: (_key: string) => {
    // Stub implementation
  }
};
