import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface BackOverrideConfig {
  /** Text displayed on the single global header Back button (#btn-nav-back) */
  label: string;
  /** Optional target URL to navigate to if onBack is not supplied */
  destination?: string;
  /** Optional custom handler for in-page sub-steps or modals */
  onBack?: () => void;
}

interface BackNavigationContextValue {
  override: BackOverrideConfig | null;
  setOverride: (config: BackOverrideConfig | null) => void;
}

const BackNavigationContext = createContext<BackNavigationContextValue>({
  override: null,
  setOverride: () => {},
});

export const BackNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [override, setOverrideState] = useState<BackOverrideConfig | null>(null);

  const setOverride = useCallback((config: BackOverrideConfig | null) => {
    setOverrideState(config);
  }, []);

  return (
    <BackNavigationContext.Provider value={{ override, setOverride }}>
      {children}
    </BackNavigationContext.Provider>
  );
};

export const useBackNavigationContext = () => useContext(BackNavigationContext);

/**
 * Future-proof hook for registering a custom step-back behavior onto the SINGLE global
 * header Back button (#btn-nav-back). Never render a secondary Back button inside pages!
 */
export const useBackNavigationOverride = (config: BackOverrideConfig | null) => {
  const { setOverride } = useBackNavigationContext();

  useEffect(() => {
    if (!config) {
      setOverride(null);
      return;
    }
    setOverride(config);
    return () => {
      setOverride(null);
    };
  }, [config?.label, config?.destination, config?.onBack, setOverride]);
};
