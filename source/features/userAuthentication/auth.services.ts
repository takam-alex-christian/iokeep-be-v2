


import userModel from "./auth.model"


//a function to create user
async function createUser({username, password}: {username: string, password: string}){

    //here we hash the password,
    //add a creationDate,
    
    // return new userModel().save()
    if(process.env.NODE_ENV === 'development'){
        console.log("createUser called")
    }

    
}

export {createUser}