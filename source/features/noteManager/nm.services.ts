

import { NoteModel } from "./nm.model";


//create note service
//read notes
//read note editorState
//update note
//delete note


function createNote(folderId: string, editorState: string): Promise<string>{
    return new Promise((createNoteResolve, createNoteReject)=>{

        new NoteModel({folderId, editorState}).save().then((noteDoc)=>{
            createNoteResolve(noteDoc._id.toString())
        }, (err)=>{
            createNoteReject(err)
        })

    })
}

function readNotes(folderId: string): Promise<[any]>{
    return new Promise((readNotesResolve, readNotesReject)=>{

        NoteModel.find({folderId}).then((notes)=>{
            readNotesResolve([notes])
        }, (err)=>{
            readNotesReject(err)
        })

    })
}

function readNoteEditorState(){

}

function deleteNote(){

}

export {createNote, readNotes}