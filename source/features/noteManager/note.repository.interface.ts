// Domain types (decoupled from any ORM) and the persistence contract for Notes.

type Note = {
  id: string;
  folderId: string;
  isPublic: boolean;
  editorState: string;
  description: string[];
  creationDate: Date;
  lastOpenedDate: Date;
  lastModifiedDate: Date;
};

type NewNote = {
  folderId: string;
  editorState: string;
  description: string[];
};

type NoteUpdate = {
  folderId?: string;
  isPublic?: boolean;
  editorState?: string;
  description?: string[];
  lastModifiedDate?: Date;
};

interface INoteRepository {
  create(data: NewNote): Promise<Note>;
  findByFolder(folderId: string): Promise<Note[]>;
  findById(noteId: string): Promise<Note | null>;
  update(noteId: string, data: NoteUpdate): Promise<boolean>;
  delete(noteId: string): Promise<boolean>;
  countByFolderIds(folderIds: string[]): Promise<Map<string, number>>;
}

export type { Note, NewNote, NoteUpdate, INoteRepository };
