import type {
  INoteRepository,
  Note,
  NoteUpdate,
} from "./note.repository.interface";
import type { IFolderRepository } from "../folderManager/folder.repository.interface";
import type { NoteJson, NoteSummaryJson } from "./types";

function toNoteJson(note: Note): NoteJson {
  return {
    _id: note.id,
    folderId: note.folderId,
    isPublic: note.isPublic,
    editorState: note.editorState,
    description: note.description,
    creationDate: note.creationDate,
    lastOpenedDate: note.lastOpenedDate,
    lastModifiedDate: note.lastModifiedDate,
  };
}

function toNoteSummary(note: Note): NoteSummaryJson {
  return {
    _id: note.id,
    folderId: note.folderId,
    isPublic: note.isPublic,
    description: note.description,
    creationDate: note.creationDate,
    lastOpenedDate: note.lastOpenedDate,
    lastModifiedDate: note.lastModifiedDate,
  };
}

function createNoteService(
  noteRepo: INoteRepository,
  folderRepo: IFolderRepository
) {
  async function createNote(
    folderId: string,
    editorState: string,
    description: string[]
  ): Promise<NoteSummaryJson> {
    const note = await noteRepo.create({ folderId, editorState, description });
    return toNoteSummary(note);
  }

  async function readNotes(folderId: string): Promise<NoteJson[]> {
    const notes = await noteRepo.findByFolder(folderId);
    return notes.map(toNoteJson);
  }

  async function readNote(noteId: string): Promise<NoteJson> {
    const note = await noteRepo.findById(noteId);

    if (!note) {
      throw new Error("inexistent noteId");
    }

    return toNoteJson(note);
  }

  async function updateNote(
    noteId: string,
    noteData: NoteUpdate
  ): Promise<boolean> {
    const update: NoteUpdate = { lastModifiedDate: new Date() };

    if (noteData.editorState !== undefined) update.editorState = noteData.editorState;
    if (noteData.description !== undefined) update.description = noteData.description;
    if (noteData.isPublic !== undefined) update.isPublic = noteData.isPublic;
    if (noteData.folderId !== undefined) update.folderId = noteData.folderId;

    const updated = await noteRepo.update(noteId, update);

    if (!updated) {
      throw new Error("no note exist with this noteId");
    }

    return true;
  }

  async function deleteNote(noteId: string): Promise<boolean> {
    const deleted = await noteRepo.delete(noteId);

    if (!deleted) {
      throw new Error("inexistent note id");
    }

    return true;
  }

  async function isFolderPublic(folderId: string): Promise<boolean> {
    const folder = await folderRepo.findById(folderId);

    if (!folder) {
      throw new Error("folder inexistent.");
    }

    return folder.isPublic;
  }

  return {
    createNote,
    readNotes,
    readNote,
    updateNote,
    deleteNote,
    isFolderPublic,
  };
}

export { createNoteService };
