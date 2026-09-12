import type { ApiClient } from "./client";
import {
  RestaurantsResource,
  TenantProfilesResource,
  TablesResource,
  TenantsResource,
  TenantOrdersResource,
  FloorCanvasesResource,
  MenusResource,
  TenantMobileConfigResource,
  OrdersResource,
  AuthResource,
  HealthResource,
  PaymentsResource,
  PublicResource,
  UserResource,
} from "./resources";

/**
 * Main API client for Restorio backend.
 * Provides typed methods for all API endpoints.
 */
export class RestorioApi {
  public readonly auth: AuthResource;
  public readonly health: HealthResource;
  public readonly payments: PaymentsResource;
  public readonly publicApi: PublicResource;
  public readonly tenantProfiles: TenantProfilesResource;
  public readonly restaurants: RestaurantsResource;
  public readonly menus: MenusResource;
  public readonly tenantMobileConfig: TenantMobileConfigResource;
  public readonly orders: OrdersResource;
  public readonly tables: TablesResource;
  public readonly tenants: TenantsResource;
  public readonly tenantOrders: TenantOrdersResource;
  public readonly floorCanvases: FloorCanvasesResource;
  public readonly users: UserResource;

  constructor(private client: ApiClient) {
    this.auth = new AuthResource(this.client);
    this.health = new HealthResource(this.client);
    this.payments = new PaymentsResource(this.client);
    this.publicApi = new PublicResource(this.client);
    this.tenantProfiles = new TenantProfilesResource(this.client);
    this.restaurants = new RestaurantsResource(this.client);
    this.floorCanvases = new FloorCanvasesResource(this.client);
    this.menus = new MenusResource(this.client);
    this.tenantMobileConfig = new TenantMobileConfigResource(this.client);
    this.orders = new OrdersResource(this.client);
    this.tables = new TablesResource(this.client);
    this.tenants = new TenantsResource(this.client);
    this.tenantOrders = new TenantOrdersResource(this.client);
    this.users = new UserResource(this.client);
  }
}
