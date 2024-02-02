
import { Request, Response, NextFunction } from "express"

import { createUser } from "./auth.services"



async function loginController(req: Request, res: Response, next: NextFunction) {

}


async function signupController(req: Request, res: Response, next: NextFunction) {

    if (req.body.username && req.body.password) {
        await createUser({ username: req.body.username, password: req.body.password }).then((userDocument) => {
            if (userDocument) {
                // user successfully created
                res.status(201).send("new user created")
            }
        }, (err) => {
            // what to do if there's an error
            if (process.env.NODE_ENV === "development") {
                console.log(`error caught on model: ${err}`)
            }

            res.status(500).send(`My bad :) timestamp: ${Date.now.toString()}`)
        })

    } else {

        if (process.env.NODE_ENV === "development") {
            console.log("username and password not provided")
        }

        res.status(400).send("")
    }


}


export { loginController, signupController }