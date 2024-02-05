
import { createFolderController, readFoldersController } from "./fm.controllers";
import {checkAccessToken} from './fm.middlewares'

import { Router } from "express";

const fmRouter = Router()


fmRouter.post("/", checkAccessToken, createFolderController);

fmRouter.get("/", checkAccessToken, readFoldersController);


export default fmRouter