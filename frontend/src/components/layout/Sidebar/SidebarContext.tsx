import { createContext, type FC, type ReactNode, useContext, useMemo, useState } from "react";

export type SidebarEventStats = {
  total: number;
  withSignature: number;
  withoutSignature: number;
};

export type SidebarEventContext = {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  organizer?: string | null;
  attendanceStats?: SidebarEventStats;
};

type SidebarContextValue = {
  event: SidebarEventContext | null;
  setEvent: (event: SidebarEventContext | null) => void;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export const SidebarProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [event, setEvent] = useState<SidebarEventContext | null>(null);

  const value = useMemo(() => ({ event, setEvent }), [event]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within SidebarProvider");
  }
  return context;
};
