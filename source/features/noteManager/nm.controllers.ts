
import { Request, Response, NextFunction } from "express";

import { createNote, readNotes, readNote, deleteNote, updateNote } from "./nm.services";


function createNoteController(req: Request, res: Response) {
    //folderId, editorState
    if (req.body.editorState && req.body.folderId) {
        createNote(req.body.folderId, req.body.editorState).then((noteId) => {
            res.status(201).json({ noteId });
        }, (err) => {
            res.status(500).send("Server Error")
            console.log(err)
        })
    } else {
        res.status(400).send("Bad request! \nnote eS&|fI");
    }
}

function readNotesController(req: Request, res: Response) {
    // req.query.folderId

    if (req.query.folderId) {

        readNotes(req.query.folderId as string).then((noteDocs) => {

            res.status(200).json({ notes: noteDocs })

        }, (err) => {
            res.sendStatus(500)
            console.log(err)
        })
    } else {
        res.sendStatus(400)
    }

    //validate folder if
    //handle wrong folder id

}

function readNoteController(req: Request, res: Response) {
    //req.params.noteId
    if (req.params.noteId) {

        readNote(req.params.noteId).then((noteDoc) => {
            res.status(200).json({ noteDoc })
        }, (err) => {
            res.sendStatus(500)
            console.log(err)
        })
    } else {
        res.status(400).json({ error: { message: `Bad Request! \n hint: notes/noteId` } })
    }
}

function updateNoteController(req: Request, res: Response) {
    //req.params.noteId
    if (req.params.noteId) {
        if (req.body.editorState) updateNote(req.params.noteId, req.body.editorState).then((updated) => {
            res.status(200).json({updated})
        }, (err) => {
            res.sendStatus(500)
            console.log(err)
        })
        else res.status(400).send("Bad Request! \n body => {eS: string}")
    } else {
        res.status(400).send("Bad Requst! \n hint: notes/noteId")
    }
}

function deleteNoteController(req: Request, res: Response) {
    if (req.params.noteId){
        deleteNote(req.params.noteId).then((deleted)=>{
            res.status(200).json({deleted})
        }, (err)=>{
            res.sendStatus(500)
            console.log(err)
        })
    }else {
        res.status(400).send("Bad Request !")
    }
}

export { createNoteController, readNotesController, readNoteController,updateNoteController, deleteNoteController}