import { Schema, model, mongo } from "mongoose";

const folderSchema = new Schema({
  _id: {
    type: mongo.ObjectId,
    default: () => {
      return new mongo.ObjectId();
    },
  },
  ownerId: {
    type: mongo.ObjectId,
    require: true,
  },
  folderName: {
    type: String,
    required: true,
  },
  creationDate: {
    //as soon as the folder is created, provide this
    type: Date,
    default: () => {
      return Date.now();
    },
  },
  lastOpenedDate: {
    // if the folder is consulted, update this
    type: Date,
    default: () => {
      return Date.now();
    },
  },
  lastModifiedDate: {
    //if there are operations within the folder, update this
    type: Date,
    default: () => {
      return Date.now();
    },
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
});

const FolderModel = model("Folder", folderSchema);

export { FolderModel };
