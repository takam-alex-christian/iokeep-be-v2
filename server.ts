
import dotenv from "dotenv"

import expressApp from "./source/app"

import {port} from "./source/config/config"

dotenv.config()



expressApp.listen(port, ()=>{
    if (process.env.NODE_ENV === "development"){
        console.log(`server live on port ${port}`)
    }
})