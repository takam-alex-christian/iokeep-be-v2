import { Request, Response, NextFunction } from "express";

import { verify } from "jsonwebtoken";

import { user_auth_key } from "../config/config";

function checkAccessToken(req: Request, res: Response, next: NextFunction) {
  if (req.cookies["access_token"] && req.cookies["refresh_token"]) {
    //@ts-ignore
    verify(
      req.cookies["access_token"],
      user_auth_key,
      //@ts-ignore
      (err, decodedPayload) => {
        if (!err) {
          if (decodedPayload.userId) {
            res.locals.userId = decodedPayload.userId;
            next();
            return;
          } else {
            res.sendStatus(401).end();
          }
        } else {
          res.status(500).json({ error: true, message: "invalid token" }).end();
          console.log(err);
        }
      }
    );
  } else {
    //this block bypasses the blockage if queried resource can be public.
    const reqPath = String(req.originalUrl).split("/"); //ouputs /sub/sub1 splitted as ["", "sub", "sub1"]

    const publicResources = ["notes", "folders"];

    if (req.method.toUpperCase() === "GET") {
      // only do this for public get as public resources are only accessible by creator for the moment

      const isPublicResource: boolean =
        publicResources.findIndex((eachPublicResource) => {
          return eachPublicResource == reqPath[1];
        }) != -1
          ? true
          : false;
      if (isPublicResource) {
        res.locals.userId = null; //we will read a null value here in read controller
        next();
        return;
      }
    }

    res.status(401).json({ error: true, message: "Login first" }).end();
  }
}

export { checkAccessToken };
