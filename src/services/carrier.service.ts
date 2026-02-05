import { Carrier } from "../core/carrier.interface";
import { UpsCarrier } from "../carriers/ups/ups.carrier";
import { RateRequest } from "../core/types";
import { validateRateRequest } from "../core/validators";
import { CarrierError } from "../core/errors";

const carriers: Record<string, Carrier> = {
  ups: new UpsCarrier(),
};

export class CarrierService {
  async getRates(carrier: string, req: RateRequest) {
    validateRateRequest(req);

    const c = carriers[carrier];
    if (!c) {
      throw new CarrierError("unsupported_carrier", "Unsupported carrier", 400, carrier);
    }

    return c.getRates(req);
  }
}
