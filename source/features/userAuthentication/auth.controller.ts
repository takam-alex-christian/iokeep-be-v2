
import { Request, Response, NextFunction } from "express"

import { createUser, authUser, getAccessToken, logoutService, verifyRefreshToken } from "./auth.services"
import { verify } from "jsonwebtoken"
import { user_auth_key } from "../../config/config"
import { AuthJsonResponse } from "./types"


async function getAccessTokenController(req: Request, res: Response) {

    const jsonResponse: AuthJsonResponse = {
        success: false,
        info: "",
        error: null,
        timeStamp: Date.now()
    }

    if (req.cookies["refresh_token"]) {
        await getAccessToken({ refreshToken: req.cookies["refresh_token"] }).then(({ accessToken }) => {
            // console.log("entered here")
            res.status(200)

            jsonResponse.success = true;
            jsonResponse.info = "New access token generated"

            res.cookie("access_token", accessToken, {
                httpOnly: true
            })

        }, (err) => {
            jsonResponse.error = {message: err.message}
            console.log(err)
        })
        
    } else {
        res.status(403)
        jsonResponse.error = {message: "No Refresh Token"}
    }

    res.json(jsonResponse)
}

// there's no reasonalbe need for a verifyAccessToken. To be deleted
function verifyAccessTokenController(req: Request, res: Response) {
    if (req.cookies["access_token"]) {

        verify(req.cookies["access_token"], user_auth_key, (err: any) => {
            if (!err) {
                res.status(200).json({ verified: true })
            } else {
                console.log(err)
                res.status(200).json({ verified: false })
            }
        })

    } else {
        res.status(400).json({ error: true, errorMessage: "no access_token found" })
    }

}

async function authenticateRefreshTokenController(req: Request, res: Response) {
    //custom response

    const jsonResponse: AuthJsonResponse = {
        success: false,
        info: "",
        error: null,
        timeStamp: Date.now()
    }

    if (req.headers.authorization) {

        let refreshToken = req.headers.authorization.split(' ')[1]

        await verifyRefreshToken(refreshToken).then(({isVerified, isValid}) => {

            if (isValid && isVerified) {
                
                jsonResponse.success = true;
                jsonResponse.info = "Token authenticated"

            }else if (isVerified && !isValid){

                jsonResponse.info = "Token Invalidated"
            
            }

        }, (err) => {
            jsonResponse.error = { message: "Failed to processs Token" }
            console.log(err)
        })

    } else {

        jsonResponse.error = {
            message: "no refresh token found"
        }

        res.status(400)

    }

    res.json(jsonResponse)

}

async function loginController(req: Request, res: Response, next: NextFunction) {

    const jsonResponse: AuthJsonResponse = {
        success: false,
        info: "",
        error: null,
        timeStamp: Date.now()
    }

    if (req.body.username && req.body.password) {
        //handle auth

        await authUser({ username: req.body.username, password: req.body.password }).then(({ authed, accessToken, refreshToken }) => { //authObject is of type authed: bool, authToken: string

            if (authed) {
                //set cookie on receiving end with jwt auth_token
                res.cookie('access_token', accessToken, {
                    httpOnly: true,
                    // domain: "localhost",
                })

                res.cookie('refresh_token', refreshToken, {
                    httpOnly: true
                })

                jsonResponse.success = true;
            }

        }).catch((err) => {
            jsonResponse.error = { message: err.message }
        })

    } else {
        jsonResponse.error = {
            message: "Bad Request! You must provide username & password"
        }
        jsonResponse.timeStamp = Date.now()
    }

    res.json(jsonResponse)
}


async function signupController(req: Request, res: Response, next: NextFunction) {

    const jsonResponse: AuthJsonResponse = {
        success: false,
        info: "",
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
                jsonResponse.error = { message: err.message }

            } else {
                res.status(500)

                jsonResponse.error = {
                    message: "Server Error"
                }
            }
        })


    } else {

        jsonResponse.error = { message: "Bad Request! username and or password not provided" }
        jsonResponse.timeStamp = Date.now()

        res.status(400)
    }


    res.json(jsonResponse)


}

function logoutController(req: Request, res: Response) {
    console.log(res.locals.userId)
    logoutService(res.locals.userId, req.cookies["refresh_token"]).then((success) => {

        res.status(200).clearCookie("access_token").json({
            loggedOut: success
        })
    }).catch((err) => {
        console.log(err)

        if (err.message == "no_matching_user") {
            res.status(200).json({
                error: true,
                errorMessage: "no Matching user"
            })
        } else {
            res.status(500).json({
                error: true,
                errorMessage: "Internal Server Error!"
            })
        }

    })
}

export { loginController, signupController, getAccessTokenController, verifyAccessTokenController, authenticateRefreshTokenController, logoutController }