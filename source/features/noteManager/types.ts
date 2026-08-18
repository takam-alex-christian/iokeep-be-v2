type NoteJson = {
  _id: string;
  folderId: string;
  isPublic: boolean;
  editorState: string;
  description: string[];
  creationDate: Date;
  lastOpenedDate: Date;
  lastModifiedDate: Date;
};

type NoteSummaryJson = Omit<NoteJson, "editorState">;

type CreateNoteJsonResponse = {
  success: boolean;
  data: NoteSummaryJson | null;
  error: null | { message: string };
  timeStamp: number;
};

type GenericNoteJsonResponse = {
  success: boolean;
  info: string;
  error: null | { message: string };
  timeStamp: number;
};

type SingleNoteJsonResponse = {
  data: NoteJson | null;
  error: null | { message: string };
  timeStamp: number;
};

type MultiNoteJsonResponse = NoteJson[];

export type {
  CreateNoteJsonResponse,
  GenericNoteJsonResponse,
  SingleNoteJsonResponse,
  MultiNoteJsonResponse,
  NoteJson,
  NoteSummaryJson,
};
