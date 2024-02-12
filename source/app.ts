
import express, { Application, Request, Response} from "express"

import bodyParser from "body-parser";
import cookieParser from "cookie-parser"


import connectDB from "./config/db"

// import features
import { auth } from "./features/userAuthentication"

import { folderManager } from "./features/folderManager";

import { noteManager } from "./features/noteManager";

//init express app

const expressApp: Application = express()


//connect db
connectDB();

//application/x-www-form-urlencoded
expressApp.use(bodyParser.urlencoded({extended: false}))

//parse application/json
expressApp.use(bodyParser.json())

//cookie parser
expressApp.use(cookieParser())

//use features routers
expressApp.use("/auth", auth)

expressApp.use("/folders",folderManager )

expressApp.use("/notes", noteManager)


//handle for non implemented routes and methods
expressApp.get("*", (req: Request, res: Response)=>{
    res.sendStatus(404)
})

expressApp.all("*", (req: Request, res: Response)=>{
    res.sendStatus(405)
})



export default expressApp