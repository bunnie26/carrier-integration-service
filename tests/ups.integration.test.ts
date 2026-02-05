process.env.UPS_BASE_URL = "https://onlinetools.ups.com";
process.env.UPS_CLIENT_ID = "test-client-id";
process.env.UPS_CLIENT_SECRET = "test-client-secret";

import nock from "nock";
import { CarrierService } from "../src/services/carrier.service";
import rateSuccess from "./fixtures/ups/rate-success.json";
import tokenSuccess from "./fixtures/ups/token-success.json";
import { UPS_BASE_URL } from "../src/config/env";

describe("UPS integration", () => {
  beforeEach(() => nock.cleanAll());

  it("fetches token and returns normalized rates", async () => {
    nock(UPS_BASE_URL)
      .post("/security/v1/oauth/token")
      .reply(200, tokenSuccess);

    nock(UPS_BASE_URL)
      .post("/api/rating/v2409/Shop")
      .reply(200, rateSuccess);

    const service = new CarrierService();

    const rates = await service.getRates("ups", {
      origin: { country: "US", postalCode: "21093", city: "TIMONIUM" },
      destination: { country: "US", postalCode: "30005", city: "Alpharetta" },
      packages: [{ weightKg: 1, lengthCm: 10, widthCm: 10, heightCm: 10 }],
    });

    expect(rates[0].carrier).toBe("ups");
    expect(rates[0].amount).toBe(12.34);
  });

  it("refreshes token and retries once on 401", async () => {
    nock(UPS_BASE_URL)
      .post("/security/v1/oauth/token")
      .reply(200, tokenSuccess);
  
    nock(UPS_BASE_URL)
      .post("/api/rating/v2409/Shop")
      .reply(401);
  
    nock(UPS_BASE_URL)
      .post("/security/v1/oauth/token")
      .reply(200, tokenSuccess);
  
    nock(UPS_BASE_URL)
      .post("/api/rating/v2409/Shop")
      .reply(200, rateSuccess);
  
    const service = new CarrierService();
  
    const rates = await service.getRates("ups", {
      origin: { country: "US", postalCode: "21093", city: "TIMONIUM" },
      destination: { country: "US", postalCode: "30005", city: "Alpharetta" },
      packages: [{ weightKg: 1, lengthCm: 10, widthCm: 10, heightCm: 10 }],
    });
  
    expect(rates[0].carrier).toBe("ups");
    expect(rates[0].service).toBe("03");
  });
  
});
