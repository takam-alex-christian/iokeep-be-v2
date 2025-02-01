import { Request, Response, NextFunction } from "express";

import {
  createNote,
  readNotes,
  readNote,
  deleteNote,
  updateNote,
} from "./nm.services";
import {
  CreateNoteJsonResponse,
  GenericNoteJsonResponse,
  MultiNoteJsonResponse,
  SingleNoteJsonResponse,
} from "./types";

async function createNoteController(req: Request, res: Response) {
  const jsonResponse: CreateNoteJsonResponse = {
    success: false,
    data: {
      _id: "",
    },
    error: null,
    timeStamp: Date.now(),
  };

  //folderId, editorState
  if (req.body.editorState && req.body.folderId && req.body.description) {
    await createNote(
      req.body.folderId,
      req.body.editorState,
      req.body.description
    ).then(
      (noteId) => {
        res.status(201);
        jsonResponse.success = true;
        jsonResponse.data._id = noteId;
      },
      (err) => {
        jsonResponse.error = { message: "Server Error! Retry again" };
        res.status(500);

        console.log(err);
      }
    );
  } else {
    jsonResponse.error = {
      message: "Bad Request! editorState and or folderId not provided",
    };
    res.status(400);
  }

  res.json(jsonResponse);
}

async function readNotesController(req: Request, res: Response) {
  // req.query.folderId

  let jsonResponse: MultiNoteJsonResponse = [];

  if (req.query.folderId) {
    await readNotes(req.query.folderId as string).then(
      (noteDocs) => {
        res.status(200);
        jsonResponse = noteDocs;
      },
      (err) => {
        res.status(500);
        console.log(err);
      }
    );
  } else {
    res.status(400);
  }

  //validate folder if
  //handle wrong folder id

  res.json(jsonResponse);
}

async function readNoteController(req: Request, res: Response) {
  const jsonResponse: SingleNoteJsonResponse = {
    data: null,
    error: null,
    timeStamp: Date.now(),
  };

  await readNote(req.params.noteId).then(
    (noteDoc) => {
      if (noteDoc.isPublic == true || res.locals.userId != null) {
        res.status(200);
        jsonResponse.data = noteDoc;
      } else {
        res.status(401);
        jsonResponse.error = {
          message: "You don't have access to this resource",
        };
      }
    },
    (err) => {
      res.status(500);
      jsonResponse.error = err;

      console.log(err);
    }
  );

  res.json(jsonResponse);
}

async function updateNoteController(req: Request, res: Response) {
  //req.params.noteId

  const jsonResponse: GenericNoteJsonResponse = {
    success: false,
    info: "",
    error: null,
    timeStamp: Date.now(),
  };

  if (req.body.editorState && req.body.description) {
    await updateNote(
      req.params.noteId,
      req.body.editorState,
      req.body.description,
      req.body.isPublic ? req.body.isPublic : null
    ).then(
      (updated) => {
        res.status(200);
        jsonResponse.success = updated;
        jsonResponse.info = updated
          ? "Note updated Successfully!"
          : "Failed to update note";
      },
      (err) => {
        res.status(500);
        jsonResponse.error = { message: "Server Error!" };
        console.log(err);
      }
    );
  } else {
    res.status(400);
    jsonResponse.error = { message: "Bad Request! \n body => {eS: string}" };
  }

  res.json(jsonResponse);
}

async function deleteNoteController(req: Request, res: Response) {
  const jsonResponse: GenericNoteJsonResponse = {
    success: false,
    info: "",
    error: null,
    timeStamp: Date.now(),
  };

  await deleteNote(req.params.noteId).then(
    (deleted) => {
      res.status(200);
      jsonResponse.success = deleted;
    },
    (err) => {
      res.status(500);
      console.log(err);
      jsonResponse.error = { message: "Server Error!" };
    }
  );

  res.json(jsonResponse);
}

export {
  createNoteController,
  readNotesController,
  readNoteController,
  updateNoteController,
  deleteNoteController,
};
