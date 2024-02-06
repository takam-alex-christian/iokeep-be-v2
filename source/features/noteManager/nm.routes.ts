
import {Router} from "express"

import {checkAccessToken} from "../../customMiddleware/checkAccessToken"

import {createNoteController,readNotesController } from "./nm.controllers"

const nmRouter = Router()

nmRouter.use(checkAccessToken)

nmRouter.post("/", createNoteController)
nmRouter.get("/", readNotesController)



export default nmRouter