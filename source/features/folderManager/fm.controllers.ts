
import { Request, Response, NextFunction } from "express";

import { createFolder, readFolders, updateFolder, deleteFolder } from "./fm.services";

import { CreateFolderJsonResponse, ReadFoldersJsonResponse, GenericFolderJsonResponse } from "./types";



async function createFolderController(req: Request, res: Response, next: NextFunction) {

    const jsonResponse: CreateFolderJsonResponse = {
        success: false,
        info: "",
        error: null,
        data: null,
        timeStamp: Date.now()
    }

    // verify expected userJson Data exist

    if (req.body.folderName) {

        // we crreate the folder
        await createFolder({ ownerId: res.locals.userId, folderName: req.body.folderName }).then((folderDoc) => {

            //handle success
            res.status(201)

            jsonResponse.success = true
            jsonResponse.info = "Folder created successfully!"
            jsonResponse.data = { folderId: folderDoc.folderId }


        }, (err) => {
            //handle for duplicate foldername
            jsonResponse.error = { message: err.message }
            res.status(500)

            console.log(err)
        })

    } else {
        jsonResponse.error = { message: "Bad Request! folderName field is missing" }
        res.status(400)
    }

    res.json(jsonResponse)
}


async function readFoldersController(req: Request, res: Response) {

    const jsonResponse: ReadFoldersJsonResponse = {
        error: null,
        data: [],
        timeStamp: Date.now()

    }

    await readFolders({ ownerId: res.locals.userId }).then((folderDocs) => {

        jsonResponse.data = folderDocs


    }, (err) => {
        res.status(500)
        jsonResponse.error = { message: err.message }
    })

    res.json(jsonResponse)

}

async function updateFolderController(req: Request, res: Response) {
    //should receive a json object of the form folderPaths: {folderName?: string, lastOpenedDate?: Date, lastModifiedDate?: Date}}

    const jsonResponse: GenericFolderJsonResponse = {
        success: false,
        error: null,
        timeStamp: Date.now()
    }

    if (req.body.folderObject) {

        await updateFolder(req.params.folderId, { ...req.body.folderObject }).then(() => {

            res.status(200)
            jsonResponse.success = true

        }, (err) => {
            console.log(err)

            res.status(500)
            jsonResponse.error = { message: err.message }
        })

    } else {
        res.status(400)
        jsonResponse.error = { message: "Bad Request! folderObject missing" }
    }

    res.json(jsonResponse)
}

async function deleteFolderController(req: Request, res: Response) {

    const jsonResponse: GenericFolderJsonResponse = {
        success: false,
        error: null,
        timeStamp: Date.now()
    }


    await deleteFolder(req.params.folderId).then((deleted) => {

        res.status(200)
        jsonResponse.success = deleted

    }, (err) => {
        console.log(err)

        res.status(500)
        jsonResponse.error = { message: err.message }

    })

    res.json(jsonResponse)

}


export { createFolderController, readFoldersController, updateFolderController, deleteFolderController }