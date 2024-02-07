
import {Request, Response, NextFunction} from 'express'

import { verify } from "jsonwebtoken";

import {user_auth_key} from '../config/config';


function checkAccessToken(req: Request, res: Response, next: NextFunction){
    if (req.cookies["access_token"] && req.cookies["refresh_token"]){

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
                res.status(500).json({error: true, message: "invalid token"}).end()
                console.log(err)

            }
            
        })

    }else {
        res.status(401).json({error: true, message: "Login first"}).end()
    }
}

export {checkAccessToken}