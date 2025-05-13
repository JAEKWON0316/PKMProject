declare module '@sparticuz/chromium' {
  export const args: string[];
  export const defaultViewport: {
    width: number;
    height: number;
  };
  export function executablePath(): Promise<string>;
  export function install(): Promise<void>;
  export default {
    args,
    defaultViewport,
    executablePath,
    install
  };
} 