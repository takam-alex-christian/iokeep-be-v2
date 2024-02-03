
import { Request, Response, NextFunction } from "express"

import { createUser, authUser } from "./auth.services"



async function loginController(req: Request, res: Response, next: NextFunction) {
    if (req.body.username && req.body.password){
        //handle auth
        
        await authUser({username: req.body.username, password: req.body.password}).then((authed)=>{
            res.status(200).send("user logged in")
        })

    }else {
        res.status(400).send("Bad Request! ")
    }
}


async function signupController(req: Request, res: Response, next: NextFunction) {

    if (req.body.username && req.body.password) {

        await createUser({ username: req.body.username, password: req.body.password }).then((userDocument) => {

            if (userDocument) {
                // user successfully created
                res.status(201).send("new user created") // if status is 201, we send a json with user token to the user
            }
        }, (err) => {
            // what to do if there's an error
            if (process.env.NODE_ENV === "development") {
                console.log(`error caught on model: ${err}`)
            }

            //handle for username_unavailable errors

            if (err.message === "username_unavailable"){
                res.status(200).send("username unavailable")
            }else {
                res.status(500).send(`My bad :) timestamp: ${new Date(Date.now()).toDateString()}`)
            }
        })

    } else {

        if (process.env.NODE_ENV === "development") {
            console.log("username and password not provided")
        }

        res.status(400).send("")
    }


}


export { loginController, signupController }