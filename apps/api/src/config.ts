import { config as loadDotEnv } from "dotenv";
import { z } from "zod";

loadDotEnv();

const EnvSchema = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  ADMIN_TOKEN: z.string().min(8).default("change-me"),
  DATABASE_URL: z.string().url().default("postgresql://postgres:postgres@localhost:5432/postgres"),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(600),
  AI_RATE_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(25),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-20250514"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export const env = EnvSchema.parse(process.env);
