import 'express-serve-static-core'
import 'express'

declare module 'express-serve-static-core' {
  interface Application {
    namedRoutes: {
      build: (name: string, params?: Record<string, string | number>) => string
      routes: Record<string, string>
    }
  }
}

declare module 'express' {
  interface Application {
    namedRoutes: {
      build: (name: string, params?: Record<string, string | number>) => string
      routes: Record<string, string>
    }
  }
}
