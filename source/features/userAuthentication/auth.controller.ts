
import { Request, Response, NextFunction } from "express"

import { createUser, authUser, getAccessToken, logoutService, verifyRefreshToken} from "./auth.services"
import { JsonWebTokenError, verify } from "jsonwebtoken"
import { user_auth_key, user_refresh_auth_key } from "../../config/config"
import { AuthJsonResponse } from "./types"


function getAccessTokenController(req: Request, res: Response) {

    if (req.cookies["refresh_token"]) {
        getAccessToken({ refreshToken: req.cookies["refresh_token"] }).then(({ accessToken }) => {
            // console.log("entered here")
            res.status(200)

            res.cookie("access_token", accessToken, {
                httpOnly: true
            })

            res.end()

        }, (err) => {
            //handle error
            res.status(200).json({
                error: true,
                errorMessage: "Login please!"
            })

            console.log(err)
        })
    } else {
        res.status(403).send("no access token")
    }
}

function verifyAccessTokenController(req: Request, res: Response) {
    if (req.cookies["access_token"]) {
        
        verify(req.cookies["access_token"], user_auth_key, ( err: any) => {
            if (!err) {
                res.status(200).json({ verified: true})
            } else {
                console.log(err)
                res.status(200).json({ verified: false})
            }
        })
        
    } else {
        res.status(400).json({ error: true, errorMessage: "no access_token found" })
    }
}

function authenticateRefreshTokenController(req: Request, res: Response){
    // console.log(req.headers.authorization)

    if (req.headers.authorization) {
        
        
        let refreshToken = req.headers.authorization.split(' ')[1]

        verifyRefreshToken(refreshToken).then((outcome)=>{
            res.json({...outcome})
        }, (err)=>{
            res.json({
                isError: true,
                errorMessage: "Failed to process token"
            })
            console.log(err)
        })
        
    } else {
        res.status(400).json({ error: true, errorMessage: "no access_token found" })
    }
}

async function loginController(req: Request, res: Response, next: NextFunction) {
    if (req.body.username && req.body.password) {
        //handle auth

        await authUser({ username: req.body.username, password: req.body.password }).then(({ authed, accessToken, refreshToken }) => { //authObject is of type authed: bool, authToken: string

            res.status(200)

            if (authed) {
                //set cookie on receiving end with jwt auth_token
                res.cookie('access_token', accessToken, {
                    httpOnly: true,
                    // domain: "localhost",
                })

                res.cookie('refresh_token', refreshToken, {
                    httpOnly: true
                })


                res.json({ authed }).end()
            } else {
                res.json({ authed })
            }

        }).catch((err) => {
            res.status(403).send(err)
        })

    } else {
        return res.status(400).send("Bad Request! ")
    }
}


async function signupController(req: Request, res: Response, next: NextFunction) {

    const jsonResponse: AuthJsonResponse = {
        success: false,
        error: null,
        timeStamp: Date.now()
    }

    if (req.body.username && req.body.password) {

        await createUser({ username: req.body.username, password: req.body.password }).then((userDocument) => {

            if (userDocument) {
                // user successfully created
                jsonResponse.success = true
                
            }

        }, (err) => {
            // what to do if there's an error
            if (process.env.NODE_ENV === "development") {
                console.log(err)
            }

            //handle for username_unavailable errors

            if (err.message === "username_unavailable") {
                jsonResponse.error = {message: err.message}
                
            } else {
                res.status(500)

                jsonResponse.error = {
                    message: "Server Error"
                }
            }
        })


    } else {

        jsonResponse.error = { message: "Bad Request! username and or password not provided"}
        jsonResponse.timeStamp = Date.now()

        res.status(400)
    }


    res.json(jsonResponse)


}

function logoutController(req: Request, res: Response){
    console.log(res.locals.userId)
    logoutService(res.locals.userId, req.cookies["refresh_token"]).then((success)=>{
        
        res.status(200).clearCookie("access_token").json({
            loggedOut: success
        })
    }).catch((err)=>{
        console.log(err)

        if (err.message == "no_matching_user"){
            res.status(200).json({
                error: true,
                errorMessage: "no Matching user"
            })
        }else {
            res.status(500).json({
                error: true,
                errorMessage: "Internal Server Error!"
            })
        }
        
    })
}

export { loginController, signupController, getAccessTokenController, verifyAccessTokenController, authenticateRefreshTokenController, logoutController}