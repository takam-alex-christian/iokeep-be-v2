
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 4000;
const database_url =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/iokeepv2?schema=public";

const user_auth_key = process.env.USER_AUTH_KEY || "test_auth_key";
const user_refresh_auth_key = process.env.USER_REFRESH_AUTH_KEY || "test_refresh_key";

export { port, database_url, user_auth_key, user_refresh_auth_key };
