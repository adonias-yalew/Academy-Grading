// Central API configuration. When the real backend exists, set VITE_API_BASE_URL and
// replace the mock implementations in this folder with fetch calls against it.
export const API_CONFIG = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "",
  useMocks: true,
  mockLatencyMs: 350,
};

export const delay = (ms = API_CONFIG.mockLatencyMs) => new Promise<void>((r) => setTimeout(r, ms));

export class ServiceError extends Error {
  constructor(message: string, public readonly fieldErrors?: Record<string, string>) {
    super(message);
  }
}
