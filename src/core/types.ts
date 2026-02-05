export type Address = {
    country: string;
    postalCode: string;
    city: string;
    state?: string;
  };
  
  export type Package = {
    weightKg: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };
  
  export type RateRequest = {
    origin: Address;
    destination: Address;
    packages: Package[];
    serviceLevel?: string;
  };
  
  export type RateQuote = {
    carrier: "ups";
    service: string;
    amount: number;
    currency: string;
    deliveryDays?: number;
  };
  