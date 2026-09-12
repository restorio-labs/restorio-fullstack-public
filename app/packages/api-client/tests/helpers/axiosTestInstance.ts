import { type AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios";
import { vi } from "vitest";

type RequestInterceptor = (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>;

export interface AxiosTestContext {
  instance: AxiosInstance;
  requestInterceptor?: RequestInterceptor;
  responseSuccess?: (response: AxiosResponse) => AxiosResponse;
  responseError?: (error: AxiosError) => Promise<never>;
}

export function setupAxiosMock(): AxiosTestContext {
  const ctx: AxiosTestContext = {
    instance: {} as AxiosInstance,
  };

  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    defaults: { headers: { common: {} } },
    interceptors: {
      request: {
        use: vi.fn((fn: RequestInterceptor) => {
          ctx.requestInterceptor = fn;

          return 0;
        }),
      },
      response: {
        use: vi.fn(
          (success: (response: AxiosResponse) => AxiosResponse, error: (error: AxiosError) => Promise<never>) => {
            ctx.responseSuccess = success;
            ctx.responseError = error;

            return 0;
          },
        ),
      },
    },
  } as unknown as AxiosInstance;

  ctx.instance = instance;

  return ctx;
}
