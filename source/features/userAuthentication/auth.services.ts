
import { hash, compare } from 'bcrypt'
import jwt from 'jsonwebtoken'


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

async function authUser({ username, password }: { username: string, password: string }): Promise<{authed: boolean, authToken: string}> {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ username }).then(async (userDoc) => {
            if (userDoc) { // user found

                if (userDoc.password) {
                    await compare(password, userDoc.password).then((passwordMatch)=>{ //compare plaintext password and encrypted password

                        //generate the authToken here
                        const authToken= jwt.sign({
                            username
                        }, process.env.USER_AUTH_KEY || '', {
                            algorithm: 'HS256'
                        })

                        resolve({authed: passwordMatch, authToken })
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

export { createUser, authUser}