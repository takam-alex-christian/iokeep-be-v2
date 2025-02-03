import { NoteModel, RawNoteDocType } from "./nm.model";

import { CreateNoteJsonResponse } from "./types";

//create note service
//read notes
//read note editorState
//update note
//delete note

function createNote(
  folderId: string,
  editorState: string,
  description: Array<string>
): Promise<CreateNoteJsonResponse["data"]> {
  return new Promise((createNoteResolve, createNoteReject) => {
    console.log(description);

    new NoteModel({ folderId, editorState, description: description })
      .save()
      .then(
        (noteDoc) => {
          const noteDocObject = noteDoc.toObject();
          //@ts-ignore
          delete noteDocObject["editorState"];
          createNoteResolve({ ...noteDocObject, _id: noteDoc.id });
        },
        (err): void => {
          createNoteReject(err);
        }
      );
  });
}

function readNotes(folderId: string): Promise<Array<any>> {
  return new Promise((readNotesResolve, readNotesReject) => {
    //the below implementation should be optimize to fetch only description field
    NoteModel.find({ folderId }).then(
      (notes) => {
        readNotesResolve(notes);
      },
      (err) => {
        readNotesReject(err);
      }
    );
  });
}

function readNote(noteId: string): Promise<any> {
  //returns editorState string
  //
  return new Promise((readNoteRsolve, readNoteReject) => {
    NoteModel.findById(noteId).then(
      (noteDoc) => {
        //should omit description field in the future
        if (noteDoc) {
          readNoteRsolve(noteDoc);
        } else {
          readNoteReject(new Error("inexistent noteId"));
        }
      },
      (err) => {
        readNoteReject(err);
      }
    );
  });
}

//function to update editorState
function updateNote(
  noteId: string,
  editorState: string,
  description: string[],
  isPublic: boolean
): Promise<boolean> {
  return new Promise((updateNoteResolve, updateNoteReject) => {
    NoteModel.findById(noteId).then(
      (noteDoc) => {
        if (noteDoc) {
          noteDoc.editorState = editorState;
          noteDoc.lastModifiedDate = new Date();
          noteDoc.description = description;
          noteDoc.isPublic = isPublic ? isPublic : noteDoc.isPublic;

          noteDoc.save().then(
            () => {
              updateNoteResolve(true);
            },
            (err) => {
              updateNoteReject(err);
            }
          );
        } else {
          updateNoteReject(new Error("no note exist with this noteId"));
        }
      },
      (err) => {
        updateNoteReject(err);
      }
    );
  });
}

function deleteNote(noteId: string): Promise<boolean> {
  return new Promise((deleteNoteResolve, deleteNoteReject) => {
    NoteModel.findById(noteId).then((noteDoc) => {
      if (noteDoc) {
        //we can proceed to delete noteDoc
        noteDoc.deleteOne().then(
          (deleteResult) => {
            deleteNoteResolve(deleteResult.acknowledged);
          },
          (err) => {
            deleteNoteReject(err);
          }
        );
      } else {
        deleteNoteReject(new Error("inexistent note id"));
      }
    });
  });
}

export { createNote, readNotes, readNote, updateNote, deleteNote };
