


import UserModel from "./auth.model"


//a function to create user
async function createUser({username, password}: {username: string, password: string}){



    //here we hash the password,
    

    

    if(process.env.NODE_ENV === 'development'){
        console.log(`createUser called time: ${Date.now().toLocaleString()}`)
    }

    return new UserModel({
        username,
        password
    }).save()

    
}

export {createUser}