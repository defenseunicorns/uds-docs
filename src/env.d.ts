/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
  interface Window {
    /** Bridged from Head.astro for is:inline scripts that can't use ES imports. */
    __astroNavigate?: (href: string) => void;
  }
}
export {};
