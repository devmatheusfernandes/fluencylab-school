"use client";

import { createContext, useState, useContext, ReactNode } from "react";

// 1. Define a "forma" do nosso contexto
interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

// 2. Cria o contexto
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// 3. Cria o "Provedor" - o componente que irá gerir o estado
export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

// 4. Cria um hook customizado para facilitar o uso do contexto
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
