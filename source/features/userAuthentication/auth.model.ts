import { InferRawDocType, Schema, model, mongo } from "mongoose";

const userSchemaDef = {
  _id: {
    type: mongo.ObjectId,
    default: () => {
      return new mongo.ObjectId();
    },
  },
  username: String,
  password: String,
  refreshTokens: {
    type: [String],
    default: [],
  },
  creationDate: {
    type: Date,
    default: () => new Date(Date.now()),
  },
};

const userSchema = new Schema(userSchemaDef);

const UserModel = model("User", userSchema);

type RawUserDocType = InferRawDocType<typeof userSchemaDef>;

export default UserModel;

export { UserModel, type RawUserDocType };
// export type {RawUserDocType}
