import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
  // undefined = not yet determined (SSR or initial render)
  // This prevents hydration mismatch by ensuring server and client start with same value
  const [matches, setMatches] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
