

import {Router} from "express"

import {signupController, loginController, getAccessTokenController, verifyAccessTokenController, logoutController, verifyRefreshTokenController} from "./auth.controller"
import { checkAccessToken } from "../../customMiddleware/checkAccessToken"


const authRouter = Router()

authRouter.post("/signup", signupController)
authRouter.post("/login", loginController)

authRouter.patch("/logout", checkAccessToken, logoutController)

authRouter.post("/access_token", verifyAccessTokenController)
authRouter.get("/access_token", getAccessTokenController )

authRouter.post("/refresh_token", verifyRefreshTokenController)

export default authRouter