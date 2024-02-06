
import {Router} from "express"

import {checkAccessToken} from "../../customMiddleware/checkAccessToken"

const nmRouter = Router()

nmRouter.use(checkAccessToken)



export {nmRouter}