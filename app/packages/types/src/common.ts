export type ParamTypes = Record<string | number | symbol, string | number | Date>;
export type LoadingState = "loading" | "loaded" | "error" | "not-found" | "idle";

export interface SuccessResponse<T> {
  message?: string;
  data: T;
}

export interface CreatedResponse<T> {
  message: string;
  data: T;
}

export interface UpdatedResponse<T> {
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ValidationErrorResponse {
  fields: string[];
}
