import 'express-serve-static-core'
import type { PathParams, RequestHandlerParams } from 'express-serve-static-core'

declare module 'express-serve-static-core' {
  interface IRouterMatcher<T> {
    (name: string, path: PathParams, ...handlers: RequestHandlerParams<any, any, any, any, any>[]): T
  }
}

