
import express, { Application } from "express"

import bodyParser from "body-parser";


import connectDB from "./config/db"

// import features
import { auth } from "./features/userAuthentication"

//init express app

const expressApp: Application = express()



//connect db
connectDB();

//application/x-www-form-urlencoded
expressApp.use(bodyParser.urlencoded({extended: false}))

//parse application/json
expressApp.use(bodyParser.json())


//use features routers
expressApp.use("/auth", auth)

export default expressApp