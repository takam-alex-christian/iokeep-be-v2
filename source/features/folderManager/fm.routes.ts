
import { createFolderController, deleteFolderController, readFoldersController, updateFolderController } from "./fm.controllers";
import {checkAccessToken} from './fm.middlewares'

import { Router } from "express";

const fmRouter = Router()


fmRouter.post("/", checkAccessToken, createFolderController);

fmRouter.get("/", checkAccessToken, readFoldersController);

fmRouter.patch("/:folderId", checkAccessToken, updateFolderController);

fmRouter.delete("/:folderId", checkAccessToken, deleteFolderController);


export default fmRouter