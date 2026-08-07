"use client";

import { createContext, useContext } from "react";

const CmsCardEditContext = createContext(false);

export function CmsCardEditProvider({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <CmsCardEditContext.Provider value={active}>{children}</CmsCardEditContext.Provider>;
}

export function useCmsCardEditScope() {
  return useContext(CmsCardEditContext);
}
