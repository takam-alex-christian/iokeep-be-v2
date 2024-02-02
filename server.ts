
import dotenv from "dotenv"

import connectMongoDb from "./source/config/db"

dotenv.config()

connectMongoDb();

console.log("mongo db")
