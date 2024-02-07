
import { createFolderController, deleteFolderController, readFoldersController, updateFolderController } from "./fm.controllers";
import { checkAccessToken } from "../../customMiddleware/checkAccessToken";

import { Router } from "express";

const fmRouter = Router()

fmRouter.use(checkAccessToken)


fmRouter.post("/", createFolderController);

fmRouter.get("/", readFoldersController);

fmRouter.patch("/:folderId", updateFolderController);

fmRouter.delete("/:folderId", deleteFolderController);


export default fmRouter