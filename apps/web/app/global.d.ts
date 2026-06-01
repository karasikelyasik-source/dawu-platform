export {};

declare global {
  interface Window {
    dawu?: {
      printReceipt: (data: any) => Promise<any>;
      getPrinters: () => Promise<
        {
          name: string;
          displayName: string;
          isDefault: boolean;
        }[]
      >;
      downloadUpdate: () => void;
      installUpdate: () => void;
    };
  }
}