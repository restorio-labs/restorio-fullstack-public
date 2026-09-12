import { vi } from "vitest";

export const axiosInstanceMock = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

export const axiosCreateMock = vi.fn(() => axiosInstanceMock);

vi.mock("axios", () => ({
  default: {
    create: axiosCreateMock,
  },
  create: axiosCreateMock,
}));
