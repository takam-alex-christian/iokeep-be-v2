
import dotenv from 'dotenv'

dotenv.config()


const port = process.env.PORT || 4000
const mongodb_uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/iokeepv2dev?"

const user_auth_key = process.env.USER_AUTH_KEY || "test_auth_key"
const user_refresh_auth_key = process.env.USER_REFRESH_AUTH_KEY || "test_refresh_key"

export {port, mongodb_uri, user_auth_key, user_refresh_auth_key}