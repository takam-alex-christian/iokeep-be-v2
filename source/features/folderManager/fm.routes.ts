
import { createFolderController } from "./fm.controllers";

import { Router } from "express";

const fmRouter = Router()


fmRouter.post("/create_folder", createFolderController);


export default fmRouter