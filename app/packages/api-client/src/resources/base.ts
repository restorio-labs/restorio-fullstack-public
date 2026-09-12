import type { ApiClient } from "../client";

/**
 * Base class for all API resources.
 * Provides access to the HTTP client.
 */
export abstract class BaseResource {
  constructor(protected client: ApiClient) {}
}
