
import { hash } from 'bcrypt'

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

export { createUser }