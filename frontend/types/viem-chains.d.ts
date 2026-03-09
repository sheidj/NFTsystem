declare module 'viem/chains' {
  export const mainnet: any;
  export const sepolia: any;
  export const polygon: any;
  export const polygonAmoy: any;
  export const arbitrum: any;
  export const optimism: any;
  export const base: any;
  export type Chain = any;
}

declare module 'pg' {
  export class Pool {
    constructor(config: { connectionString?: string });
    end(): Promise<void>;
  }
}
