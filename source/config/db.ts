
import { connect, connection } from "mongoose"
//connect to db

import { mongodb_uri } from "./config"



export default function connectMongoDb() {
    connect(mongodb_uri).catch((e) => {
        //log this into a file somewhere
        console.log(e)
    })


    connection.once("open", ()=>{
        
       if (process.env.NODE_ENV === 'development'){
        console.log("MongoDb connected")
       }
    })

    connection.on("error", (e)=>{
        if (process.env.NODE_ENV === 'production'){
            console.log("Error on mongodb")
        }
    })
}


