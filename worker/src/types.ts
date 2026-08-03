export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  APP_ORIGIN: string;
  RESEND_RECEIVING_DOMAIN: string;
  RESEND_API_KEY?: string;
  RESEND_WEBHOOK_SECRET?: string;
}

export interface UserRow {
  id: number;
  email: string;
  nickname: string;
  inbox_token: string;
}

export type Variables = { user: UserRow };
