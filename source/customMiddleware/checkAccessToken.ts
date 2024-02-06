
import {Request, Response, NextFunction} from 'express'

import { verify } from "jsonwebtoken";

import {user_auth_key} from '../config/config';


function checkAccessToken(req: Request, res: Response, next: NextFunction){
    if (req.cookies["access_token"]){

        console.log("we have and access_token thought")

        //@ts-ignore
        verify(req.cookies["access_token"], user_auth_key, (err, decodedPayload)=>{
            if (!err){

                if(decodedPayload.userId){
                    res.locals.userId = decodedPayload.userId
                    next()
                    return;
                }else {
                    res.sendStatus(401).end()
                }

            }else {
                res.sendStatus(500).end()

            }
            
        })

    }else {
        res.sendStatus(400)
    }
}

export {checkAccessToken}