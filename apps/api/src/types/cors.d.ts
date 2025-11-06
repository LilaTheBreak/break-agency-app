declare module "cors" {
  import type { RequestHandler } from "express";

  namespace cors {
    interface CorsRequest {
      method?: string;
      headers?: Record<string, string | string[] | undefined>;
    }

    type CustomOrigin = (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => void;

    interface CorsOptions {
      origin?: boolean | string | RegExp | Array<string | RegExp> | CustomOrigin;
      methods?: string | string[];
      allowedHeaders?: string | string[];
      exposedHeaders?: string | string[];
      credentials?: boolean;
      maxAge?: number;
      preflightContinue?: boolean;
      optionsSuccessStatus?: number;
    }

    type CorsOptionsDelegate<T extends CorsRequest = CorsRequest> = (
      req: T,
      callback: (err: Error | null, options?: CorsOptions) => void
    ) => void;
  }

  function cors(
    options?: cors.CorsOptions | cors.CorsOptionsDelegate
  ): RequestHandler;

  export default cors;
  export type CorsOptions = cors.CorsOptions;
  export type CorsOptionsDelegate<T extends cors.CorsRequest = cors.CorsRequest> =
    cors.CorsOptionsDelegate<T>;
  export type CorsRequest = cors.CorsRequest;
}
