import { Schema, model, mongo, InferRawDocType } from "mongoose";

const noteSchemaDef = {
  _id: {
    type: mongo.ObjectId,
    default: () => {
      return new mongo.ObjectId();
    },
  },
  folderId: {
    type: mongo.ObjectId,
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  editorState: {
    type: String,
    required: true,
  },
  description: [String],

  creationDate: {
    type: Date,
    default: () => {
      return new Date();
    },
  },
  lastOpenedDate: {
    type: Date,
    default: () => {
      return new Date();
    },
  },
  lastModifiedDate: {
    type: Date,
    default: () => {
      return new Date();
    },
  },
};

const noteSchema = new Schema(noteSchemaDef);

const NoteModel = model("Note", noteSchema);

type RawNoteDocType = InferRawDocType<typeof noteSchemaDef>;

export { NoteModel, RawNoteDocType };
