

import {Router} from "express"

import {signupController} from "./auth.controller"


const authRouter = Router()

authRouter.post("/signup", signupController)

export default authRouter