

import { Schema, model, mongo } from "mongoose"



const userSchema = new Schema({
    _id: {
        type: mongo.ObjectId,
        default: () => {
            return new mongo.ObjectId()
        }
    },
    username: String,
    password: String,
    refreshTokens: {
        type: [String],
        default: []
    },
    creationDate: {
        type: Date,
        default: () => new Date(Date.now())
    },
})

export default model("User", userSchema)