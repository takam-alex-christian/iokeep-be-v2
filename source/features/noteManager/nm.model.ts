

import {Schema, model, mongo, } from 'mongoose'



const noteSchema = new Schema({
    _id: {
        type: mongo.ObjectId,
        default: ()=>{
            return new mongo.ObjectId()
        }
    },
    folderId: {
        type: mongo.ObjectId,
        required: true
    },
    editorState: { 
        type: String,
        required: true
    },
    description:[String],

    creationDate: {
        type: Date,
        default: ()=>{
            return new Date()
        }
    },
    lastOpenedDate: {
        type: Date,
        default: ()=>{
            return new Date()
        }
    },
    lastModifiedDate: {
        type: Date,
        default: ()=>{
            return new Date()
        }
    },
    

})

const NoteModel = model("Note", noteSchema);

export {NoteModel}