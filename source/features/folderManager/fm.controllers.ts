
import { Request, Response, NextFunction } from "express";

import { verify } from "jsonwebtoken";

import { createFolder, readFolders} from "./fm.services";

import {user_auth_key} from '../../config/config'



function createFolderController(req: Request, res: Response, next: NextFunction) {

    //if access_token cookie exist

    if (req.cookies["access_token"]) {

        // verify expected userJson Data exist

        if (req.body.folderName) {

            if (process.env.USER_AUTH_KEY) {// make sure USER_AUTH_KEY exists

                // verify token 
                //@ts-ignore
                verify(req.cookies["access_token"], process.env.USER_AUTH_KEY, (err, decodedPayload) => {
                    if (!err) {
                        // decodedPayload contains userId

                        // we crreate the folder
                        //@ts-ignore
                        createFolder({ownerId: decodedPayload!.userId, folderName: req.body.folderName}).then((folderDoc)=>{
                            
                            //handle success
                            res.status(201).json({
                                ...folderDoc
                            }).end()

                        }, (err)=>{
                            res.status(500).send("Server Error :(").end()
                            console.log(err)
                        })


                    } else {
                        //perhaps token is unverified
                        res.status(500).send(err).end()
                    }
                })

            } else {
                //handle for process.env
                res.status(500).send("Server Error").end()
                throw new Error("env variable not found")

            }
        }else {
            res.status(400).send("Bad Request").end()
        }

    } else {
        // handler for aunauthorized access

        res.status(401).send("unauthorized").end()
    }

}


function readFoldersController(req: Request, res: Response){

    if (req.cookies['access_token']){


        //@ts-ignore
        verify(req.cookies["access_token"], user_auth_key, (err, decodedPayload)=>{
            if (!err){
                
                if (decodedPayload.userId){

                    readFolders({ownerId: decodedPayload.userId}).then((folderDocs)=>{
                        res.send(JSON.stringify({folderDocs})).end()
                    }).catch(()=>{
                        res.sendStatus(500)
                    })

                }else res.sendStatus(403)

            }else res.sendStatus(401)
        })
        

    }else {
        res.sendStatus(400)
    }

}

export { createFolderController, readFoldersController}