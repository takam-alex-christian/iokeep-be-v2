

import {Router} from "express"

import {signupController, loginController} from "./auth.controller"


const authRouter = Router()

authRouter.post("/signup", signupController)
authRouter.post("/login", loginController)

export default authRouter