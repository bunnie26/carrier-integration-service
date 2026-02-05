export class CarrierError extends Error {
    code: string;
    status?: number;
    carrier?: string;
  
    constructor(code: string, message: string, status?: number, carrier?: string) {
      super(message);
      this.code = code;
      this.status = status;
      this.carrier = carrier;
    }
  }
  
  export function isCarrierError(err: unknown): err is CarrierError {
    return err instanceof CarrierError;
  }
  