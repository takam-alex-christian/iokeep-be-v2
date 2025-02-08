import { RawNoteDocType } from "./nm.model";

type CreateNoteJsonResponse = {
  success: boolean;
  data: Partial<Omit<RawNoteDocType, "_id" | "editorState">> & {
    _id: string;
    editorState?: string;
  };
  error: null | { message: string };
  timeStamp: number;
};

type GenericNoteJsonResponse = {
  //patch & delete response
  success: boolean;
  info: string;
  error: null | { message: string };
  timeStamp: number;
};

type SingleNoteJsonResponse = {
  //get one note
  data: null | {
    _id: string;
    editorState: string;
    creationDate: string;
    lastModified: string;
  };
  error: null | { message: string };
  timeStamp: number;
};

type MultiNoteJsonResponse = Array<{
  _id: string;
  editorState: string;
  creationDate: string;
  lastModified: string;
  description: Array<string>;
}>;

export type {
  CreateNoteJsonResponse,
  GenericNoteJsonResponse,
  SingleNoteJsonResponse,
  MultiNoteJsonResponse,
};
