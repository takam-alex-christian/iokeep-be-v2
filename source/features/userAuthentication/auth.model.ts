

import { Schema, model } from "mongoose"



const userSchema = new Schema({
    userId: String,
    username: String,
    password: String,
    creationDate: Date,
}, {
    _id: false
})

export default model("User", userSchema)