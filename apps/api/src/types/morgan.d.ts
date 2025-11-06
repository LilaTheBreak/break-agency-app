declare module "morgan" {
  import type { Request, Response } from "express";
  import type { RequestHandler } from "express";

  namespace morgan {
    type TokenCallback<TReq extends Request = Request, TRes extends Response = Response> = (
      req: TReq,
      res: TRes
    ) => string | number | undefined;

    interface TokenIndexer<TReq extends Request = Request, TRes extends Response = Response> {
      [tokenName: string]: TokenCallback<TReq, TRes>;
    }

    type FormatFn<TReq extends Request = Request, TRes extends Response = Response> = (
      tokens: TokenIndexer<TReq, TRes>,
      req: TReq,
      res: TRes
    ) => string;

    type Format<TReq extends Request = Request, TRes extends Response = Response> =
      | string
      | FormatFn<TReq, TRes>;

    interface Options<TReq extends Request = Request, TRes extends Response = Response> {
      skip?: (req: TReq, res: TRes) => boolean;
      stream?: NodeJS.WritableStream;
    }
  }

  function morgan<TReq extends Request = Request, TRes extends Response = Response>(
    format: morgan.Format<TReq, TRes>,
    options?: morgan.Options<TReq, TRes>
  ): RequestHandler<TReq, TRes>;

  export default morgan;
  export type Format<TReq extends Request = Request, TRes extends Response = Response> =
    morgan.Format<TReq, TRes>;
  export type FormatFn<TReq extends Request = Request, TRes extends Response = Response> =
    morgan.FormatFn<TReq, TRes>;
  export type TokenIndexer<TReq extends Request = Request, TRes extends Response = Response> =
    morgan.TokenIndexer<TReq, TRes>;
  export type Options<TReq extends Request = Request, TRes extends Response = Response> =
    morgan.Options<TReq, TRes>;
}
