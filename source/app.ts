
import express, { Application } from "express"


import connectDB from "./config/db"

//init express app

const expressApp: Application = express()



//connect db
connectDB();


// import features
import { auth } from "./features/userAuthentication"


//use features routers
expressApp.use("/auth", auth)

export default expressApp