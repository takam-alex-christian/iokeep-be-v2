
import { createFolderController, readFoldersController } from "./fm.controllers";

import { Router } from "express";

const fmRouter = Router()


fmRouter.post("/", createFolderController);

fmRouter.get("/", readFoldersController);


export default fmRouter