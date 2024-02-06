

import { NoteModel } from "./nm.model";


//create note service
//read notes
//read note editorState
//update note
//delete note


function createNote(folderId: string, editorState: string): Promise<string> {
    return new Promise((createNoteResolve, createNoteReject) => {

        new NoteModel({ folderId, editorState }).save().then((noteDoc) => {
            createNoteResolve(noteDoc._id.toString())
        }, (err) => {
            createNoteReject(err)
        })

    })
}

function readNotes(folderId: string): Promise<Array<any>> {
    return new Promise((readNotesResolve, readNotesReject) => {

        NoteModel.find({ folderId }).then((notes) => {
            readNotesResolve(notes)
        }, (err) => {
            readNotesReject(err)
        })

    })
}

function readNoteEditorState(noteId: string): Promise<string> { //returns editorState string
    //
    return new Promise((readNoteRsolve, readNoteReject) => {
        NoteModel.findById(noteId).then((noteDoc) => {
            if (noteDoc) {
                readNoteRsolve(noteDoc.editorState)
            } else {
                readNoteReject(new Error("inexistent noteId"))
            }
        }, (err) => {
            readNoteReject(err)
        })
    })
}

//function to update editorState

function deleteNote(noteId: string): Promise<boolean>{
    return new Promise((deleteNoteResolve, deleteNoteReject) => {
        NoteModel.findById(noteId).then((noteDoc) => {
            if (noteDoc) {
                //we can proceed to delete noteDoc
                noteDoc.deleteOne().then((deleteResult) => {

                    deleteNoteResolve(deleteResult.acknowledged)

                }, (err) => {
                    deleteNoteReject(err)
                })
            } else {
                deleteNoteReject(new Error("inexistent note id"))
            }
        })
    })
}

export { createNote, readNotes, deleteNote}