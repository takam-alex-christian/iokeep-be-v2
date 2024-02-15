
import { Request, Response, NextFunction } from "express";

import { createNote, readNotes, readNote, deleteNote, updateNote } from "./nm.services";
import { CreateNoteJsonResponse, MultiNoteJsonResponse, SingleNoteJsonResponse } from "./types";


async function createNoteController(req: Request, res: Response) {

    const jsonResponse: CreateNoteJsonResponse = {
        success: false,
        data: {
            _id: ""
        },
        error: null,
        timeStamp: Date.now()
    }

    //folderId, editorState
    if (req.body.editorState && req.body.folderId) {
        await createNote(req.body.folderId, req.body.editorState).then((noteId) => {

            res.status(201)
            jsonResponse.success = true
            jsonResponse.data._id = noteId

        }, (err) => {
            
            jsonResponse.error = {message: "Server Error! Retry again"}
            res.status(500)

            console.log(err)
        })

    } else {
        jsonResponse.error = {message: "Bad Request! editorState and or folderId not provided"}
        res.status(400)
    }

    res.json(jsonResponse)
}

async function readNotesController(req: Request, res: Response) {
    // req.query.folderId

    const jsonResponse: MultiNoteJsonResponse = {
        error: null,
        data: [],
        timeStamp: Date.now()
    }

    if (req.query.folderId) {

        await readNotes(req.query.folderId as string).then((noteDocs) => {
        
            res.status(200)
            jsonResponse.data = noteDocs

        }, (err) => {
            res.status(500)

            jsonResponse.error = {message: "Server Error! Try again shortly."}
            console.log(err)
        })
    } else {
        res.status(400)
        jsonResponse.error = {message: "Bad Request! missing folder id"}
    }

    //validate folder if
    //handle wrong folder id

    res.json(jsonResponse)

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