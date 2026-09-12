import { BaseResource } from "./base";

export class HealthResource extends BaseResource {
  async isReachable(): Promise<boolean> {
    const code = await this.client.getHttpStatus("health");

    return code === 200;
  }
}
