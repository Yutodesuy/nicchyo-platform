'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface MenuContextType {
  isMenuOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openMenu = useCallback(() => setIsMenuOpen(true), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const toggleMenu = useCallback(() => setIsMenuOpen((prev) => !prev), []);

  return (
    <MenuContext.Provider value={{ isMenuOpen, openMenu, closeMenu, toggleMenu }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within MenuProvider');
  }
  return context;
}
