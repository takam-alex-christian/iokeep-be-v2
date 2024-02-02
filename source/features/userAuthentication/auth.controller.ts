
import {Request, Response, NextFunction} from "express"

import {createUser} from "./auth.services"



async function loginController(req: Request, res: Response, next: NextFunction){
    
}


async function signupController(req: Request, res: Response, next: NextFunction){

    try{
        await createUser({username: "john_Doe", password: "superPassword"}).then((userDocument)=>{
            if(userDocument){
                // user successfully created
                res.status(201).send("new user created")
            }
        }, (err)=>{
            // what to do if there's an error
            if (process.env.NODE_ENV === "development"){
                console.log(`error caught on model: ${err}`)
            }
        })
    }catch(e){

        if(process.env.NODE_ENV === "development"){
            console.log(e)
        }

        res.status(500).send("user not created")
        // next(e) //next middleware 
    }
}


export {loginController, signupController}