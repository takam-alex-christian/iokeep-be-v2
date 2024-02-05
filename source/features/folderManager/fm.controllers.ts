
import { Request, Response, NextFunction } from "express";

import { verify } from "jsonwebtoken";

import { createFolder, readFolders, updateFolder } from "./fm.services";

import { user_auth_key } from '../../config/config'



function createFolderController(req: Request, res: Response, next: NextFunction) {

    //if access_token cookie exist

    if (req.cookies["access_token"]) {

        // verify expected userJson Data exist

        if (req.body.folderName) {

            // we crreate the folder
            createFolder({ ownerId: res.locals.userId, folderName: req.body.folderName }).then((folderDoc) => {

                //handle success
                res.status(201).json({
                    ...folderDoc
                }).end()

            }, (err) => {
                res.status(500).send("Server Error :(").end()
                console.log(err)
            })

        } else {
            res.status(400).send("Bad Request").end()
        }

    } else {
        // handler for aunauthorized access

        res.status(401).send("unauthorized").end()
    }

}


function readFoldersController(req: Request, res: Response) {


    readFolders({ ownerId: res.locals.userId }).then((folderDocs) => {

        res.send(JSON.stringify({ folderDocs }))

    }, (err) => {
        res.sendStatus(500)
    })


}

function updateFolderController(req: Request, res: Response) {
    //should receive a json object of the form folderPaths: {folderName?: string, lastOpenedDate?: Date, lastModifiedDate?: Date}}

    if (req.params.folderId && req.body.folderObject) {

        updateFolder(req.params.folderId, { ...req.body.folderObject }).then((folderUpdated) => {

            res.status(200).json({ folderUpdated })

        }, (err) => {
            console.log(err)
            res.sendStatus(500)
        })
        
    }else {
        res.sendStatus(400)
    }
}



export { createFolderController, readFoldersController, updateFolderController }