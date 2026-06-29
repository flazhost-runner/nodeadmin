import 'express-session';

declare module 'express-session' {
  interface SessionData {
    errors?: any;
    flashMessage?: { key: string, message: string };
    old?: any;
  }
}
