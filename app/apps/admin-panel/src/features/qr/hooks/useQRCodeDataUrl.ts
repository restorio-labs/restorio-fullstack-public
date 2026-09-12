import { useQuery } from "@tanstack/react-query";
import { toDataURL } from "qrcode";

interface UseQRCodeDataUrlOptions {
  width?: number;
  margin?: number;
  errorMessage?: string;
}

export const useQRCodeDataUrl = (url: string | null, options?: UseQRCodeDataUrlOptions): string | null => {
  const width = options?.width ?? 640;
  const margin = options?.margin ?? 2;

  const { data: qrDataUrl = null } = useQuery({
    queryKey: ["qr-code", url, width, margin],
    queryFn: async () => {
      try {
        return await toDataURL(url!, { width, margin });
      } catch (error) {
        if (options?.errorMessage) {
          console.error(options.errorMessage, error);
        }

        return null;
      }
    },
    enabled: url !== null,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  });

  return qrDataUrl;
};
