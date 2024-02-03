

import {Router} from "express"

import {signupController, loginController, getAccessTokenController} from "./auth.controller"


const authRouter = Router()

authRouter.post("/signup", signupController)
authRouter.post("/login", loginController)

authRouter.get("/access_token", getAccessTokenController )

export default authRouter