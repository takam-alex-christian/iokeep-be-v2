

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

function readNote(noteId: string): Promise<any> { //returns editorState string
    //
    return new Promise((readNoteRsolve, readNoteReject) => {
        NoteModel.findById(noteId).then((noteDoc) => {
            if (noteDoc) {
                readNoteRsolve(noteDoc)
            } else {
                readNoteReject(new Error("inexistent noteId"))
            }
        }, (err) => {
            readNoteReject(err)
        })
    })
}

//function to update editorState
function updateNote(noteId: string, editorState: string): Promise<boolean>{
    return new Promise ((updateNoteResolve, updateNoteReject)=>{
        
        NoteModel.findById(noteId).then((noteDoc)=>{
            if (noteDoc){
                noteDoc.editorState = editorState;
                noteDoc.lastModifiedDate = new Date();

                noteDoc.save().then(()=>{
                    updateNoteResolve(true)
                }, (err)=>{
                    updateNoteReject(err)
                })
                
            }else {
                updateNoteReject(new Error("no note exist with this noteId"))
            }
        }, (err)=>{
            updateNoteReject(err)
        })
    })
}

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

export { createNote, readNotes, readNote, updateNote,deleteNote}