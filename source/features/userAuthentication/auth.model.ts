

import { Schema, model } from "mongoose"



const userSchema = new Schema({
    userId: String,
    username: String
})