
const port = process.env.PORT || 4000
const mongodb_uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/iokeepv2dev?"

export {port, mongodb_uri}