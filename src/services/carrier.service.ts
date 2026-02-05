import { Carrier } from "../core/carrier.interface";
import { UpsCarrier } from "../carriers/ups/ups.carrier";
import { RateRequest } from "../core/types";

const carriers: Record<string, Carrier> = {
  ups: new UpsCarrier(),
};

export class CarrierService {
  async getRates(carrier: string, req: RateRequest) {
    const c = carriers[carrier];
    if (!c) throw new Error("Unsupported carrier");
    return c.getRates(req);
  }
}
