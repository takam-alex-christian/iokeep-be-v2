
import {Router} from "express"

import {checkAccessToken} from "../../customMiddleware/checkAccessToken"

import {createNoteController,readNotesController, readNoteController, updateNoteController, deleteNoteController} from "./nm.controllers"

const nmRouter = Router()

nmRouter.use(checkAccessToken)

nmRouter.post("/", createNoteController)
nmRouter.get("/", readNotesController)
nmRouter.get("/:noteId", readNoteController)
nmRouter.patch("/:noteId", updateNoteController)
nmRouter.delete("/:noteId", deleteNoteController)


export default nmRouter