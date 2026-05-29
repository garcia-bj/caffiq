import { createContext, useContext, useState } from "react";

interface NavbarContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const NavbarContext = createContext<NavbarContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <NavbarContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </NavbarContext.Provider>
  );
}

export const useNavbar = () => useContext(NavbarContext);
