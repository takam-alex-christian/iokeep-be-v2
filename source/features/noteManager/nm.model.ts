

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
    creationDate: {
        type: Date,
        default: ()=>{
            return Date.now()
        }
    },
    lastOpenedDate: {
        type: Date,
        default: ()=>{
            return Date.now()
        }
    },
    lastModifiedDate: {
        type: Date,
        default: ()=>{
            return Date.now()
        }
    },
    editorState: { 
        type: String,
        required: true
    }

})

const NoteModel = model("Note", noteSchema);

export {NoteModel}