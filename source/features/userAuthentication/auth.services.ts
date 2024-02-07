
import { hash, compare } from 'bcrypt'
import jwt from 'jsonwebtoken'

import { user_auth_key, user_refresh_auth_key } from '../../config/config'

import UserModel from "./auth.model"



async function doesUsernameExist({ username }: { username: string }): Promise<boolean> {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ username }).then((userDoc) => {
            if (userDoc) resolve(true)
            else resolve(false)
        }).catch((err) => {
            reject(err)
        })
    })
}

async function authUser({ username, password }: { username: string, password: string }): Promise<{ authed: boolean, accessToken: string, refreshToken: string }> {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ username }).then(async (userDoc) => {
            if (userDoc) { // user found

                if (userDoc.password) {
                    await compare(password, userDoc.password).then((passwordMatch) => { //compare plaintext password and encrypted password

                        //generate the authToken here


                        jwt.sign({
                            userId: userDoc._id
                        }, user_refresh_auth_key, { algorithm: 'HS256' }, (err, refreshToken) => {
                            if (!err) {
                                //save the refresh token to db

                                userDoc.refreshTokens.push(refreshToken!)

                                userDoc.save().then(() => {
                                    //handle refreshToken saved

                                        const accessToken = jwt.sign({
                                            userId: userDoc._id
                                        }, user_auth_key, {
                                            algorithm: 'HS256'
                                        })

                                        resolve({ authed: passwordMatch, accessToken, refreshToken: refreshToken! })

                                }, (err) => {
                                    //handle save refreshToken error
                                    reject(err);
                                })


                            } else {
                                reject(err)
                            }
                        })

                    })
                } else {
                    // handle for empty userDoc.password
                    // or update for schema password type to 
                    reject(new Error("My Bad ;)"))
                }


            } else {
                //handler for user not found
                reject(new Error("user_not_found"))
            }
        }, (err) => {
            //handle for dbms error
            reject(err)
        })
    })
}

function getAccessToken({ refreshToken }: { refreshToken: string }): Promise<{ accessToken: string }> {
    return new Promise((getAccessTokenResolve, getAccessTokenReject) => {

        if (process.env.USER_REFRESH_AUTH_KEY) {

            jwt.verify(refreshToken, process.env.USER_REFRESH_AUTH_KEY, (err, decodedPayload) => {
                if (!err) {

                    //@ts-ignore
                    UserModel.findOne({ _id: decodedPayload?.userId }).then((userDoc) => {

                        if (userDoc) {

                            if (userDoc.refreshTokens.includes(refreshToken)) {
                                //generate and return a new access_token

                                jwt.sign({ userId: userDoc._id }, process.env.USER_AUTH_KEY!, { algorithm: "HS256", expiresIn: "10m" }, (err, accessToken) => {
                                    if (!err && accessToken) {
                                        return getAccessTokenResolve({ accessToken: accessToken })
                                    } else {
                                        return getAccessTokenReject(err)
                                    }
                                })
                            } else {
                                //non existing refresh token
                                //handle error
                                console.log("invalid refresh token, login please")
                            }



                        } else {
                            return getAccessTokenReject(new Error("No user with this _id"))
                        }

                    }, (err) => {
                        return getAccessTokenReject(err);
                    })



                } else {
                    //handle for verify errors
                    return getAccessTokenReject(err)
                }
            })

        } else {
            return getAccessTokenReject(new Error("process.env.USER_REFRESH_AUTH_KEY is undefined | null"))
        }

    })
}

//a function to create user
async function createUser({ username, password }: { username: string, password: string }) {

    //check if username exist first

    const saltRounds = 10

    const createUserPromise = new Promise((createUserResolve, createUserReject) => {

        doesUsernameExist({ username }).then(async (userExist) => {

            if (!userExist) {

                await hash(password, saltRounds).then((generatedHash) => {

                    return createUserResolve(new UserModel({
                        username,
                        password: generatedHash
                    }).save())

                }, (err) => {
                    //handle problem with hashing the password
                    if (process.env.NODE_ENV === 'development') {
                        console.log(`error while hashing user password, for more info-> ${err}`);
                    }

                    return createUserReject(err)
                })

            } else {
                createUserReject(new Error("username_unavailable"))
            }
        }, (err) => {
            createUserReject(err)
        })
    })


    if (process.env.NODE_ENV === 'development') {
        console.log(`createUser called time: ${new Date(Date.now()).toISOString()}`)
    }


    return createUserPromise
}

export { createUser, authUser, getAccessToken }