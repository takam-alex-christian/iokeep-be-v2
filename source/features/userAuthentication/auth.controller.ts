
import { Request, Response, NextFunction } from "express"

import { createUser, authUser, getAccessToken} from "./auth.services"


function getAccessTokenController(req: Request, res: Response){

    if(req.cookies["refresh_token"]){
        getAccessToken({refreshToken: req.cookies["refresh_token"]}).then(({accessToken})=>{
            // console.log("entered here")
            res.status(200)
            
            res.cookie("access_token", accessToken, {
                httpOnly: true
            })
            
            res.end()
            
            
        }, (err)=>{
            //handle error
            
        })
    }else {
        res.status(403).send("no access token")
    }
}

async function loginController(req: Request, res: Response, next: NextFunction) {
    if (req.body.username && req.body.password){
        //handle auth
        
        await authUser({username: req.body.username, password: req.body.password}).then(({authed, accessToken, refreshToken})=>{ //authObject is of type authed: bool, authToken: string
            
            res.status(200)

            if (authed){
                //set cookie on receiving end with jwt auth_token
                res.cookie('access_token', accessToken, {
                    httpOnly: true,
                    // domain: "localhost",
                })

                res.cookie('refresh_token', refreshToken, {
                    httpOnly: true
                })


                res.json({authed}).end()
            }else {
                res.json({authed})
            }

        }).catch((err)=>{
            res.status(403).send(err)
        })

    }else {
        return res.status(400).send("Bad Request! ")
    }
}


async function signupController(req: Request, res: Response, next: NextFunction) {

    if (req.body.username && req.body.password) {

        await createUser({ username: req.body.username, password: req.body.password }).then((userDocument) => {

            if (userDocument) {
                // user successfully created
                res.status(201).send({success: true}) // if status is 201, we send a json with user token to the user
                
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


export { loginController, signupController, getAccessTokenController}