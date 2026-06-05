import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (globalThis.window !== undefined) {
      return globalThis.window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });

  React.useEffect(() => {
    const mql = globalThis.window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(globalThis.window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
