import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";

import { user_auth_key, user_refresh_auth_key } from "../../config/config";

import { UserModel, RawUserDocType } from "./auth.model";

async function doesUsernameExist({
  username,
}: {
  username: string;
}): Promise<boolean> {
  return new Promise((resolve, reject) => {
    UserModel.findOne({ username })
      .then((userDoc) => {
        if (userDoc) resolve(true);
        else resolve(false);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

async function authUser({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<{
  userData: Pick<RawUserDocType, "username">;
  authed: boolean;
  accessToken: string;
  refreshToken: string;
}> {
  return new Promise((resolve, reject) => {
    UserModel.findOne({ username }).then(
      async (userDoc) => {
        if (userDoc) {
          // user found

          if (userDoc.password) {
            await compare(password, userDoc.password).then((passwordMatch) => {
              //compare plaintext password and encrypted password

              //generate the authToken here

              if (passwordMatch) {
                jwt.sign(
                  {
                    userId: userDoc._id,
                  },
                  user_refresh_auth_key,
                  { algorithm: "HS256" },
                  (err, refreshToken) => {
                    if (!err) {
                      //save the refresh token to db

                      userDoc.refreshTokens.push(refreshToken!);

                      userDoc.save().then(
                        (userDoc) => {
                          //handle refreshToken saved

                          const accessToken = jwt.sign(
                            {
                              userId: userDoc._id,
                            },
                            user_auth_key,
                            {
                              algorithm: "HS256",
                            }
                          );

                          if (process.env.NODE_ENV == "development") {
                            console.log({
                              userDoc,
                              passwordMatch,
                              accessToken,
                              refreshToken,
                            });
                          }

                          resolve({
                            userData: userDoc,
                            authed: passwordMatch,
                            accessToken,
                            refreshToken: refreshToken!,
                          });
                        },
                        (err) => {
                          //handle save refreshToken error
                          reject(err);
                        }
                      );
                    } else {
                      reject(err);
                    }
                  }
                );
              } else {
                reject(new Error("Password incorrect"));
              }
            });
          } else {
            // handle for empty userDoc.password
            // or update for schema password type to
            reject(new Error("My Bad ;)"));
          }
        } else {
          //handler for user not found
          reject(new Error("user_not_found"));
        }
      },
      (err) => {
        //handle for dbms error
        reject(err);
      }
    );
  });
}

function getAccessToken({
  refreshToken,
}: {
  refreshToken: string;
}): Promise<{ accessToken: string }> {
  return new Promise((getAccessTokenResolve, getAccessTokenReject) => {
    jwt.verify(refreshToken, user_refresh_auth_key, (err, decodedPayload) => {
      if (!err) {
        //@ts-ignore
        UserModel.findOne({ _id: decodedPayload?.userId }).then(
          (userDoc) => {
            if (userDoc) {
              if (userDoc.refreshTokens.includes(refreshToken)) {
                //generate and return a new access_token

                jwt.sign(
                  { userId: userDoc._id },
                  process.env.USER_AUTH_KEY!,
                  { algorithm: "HS256", expiresIn: "10m" },
                  (err, accessToken) => {
                    if (!err && accessToken) {
                      return getAccessTokenResolve({
                        accessToken: accessToken,
                      });
                    } else {
                      return getAccessTokenReject(err);
                    }
                  }
                );
              } else {
                //non existing refresh token
                //handle error
                // console.log("invalid refresh token, login please")
                getAccessTokenReject(new Error("invalidated"));
              }
            } else {
              return getAccessTokenReject(new Error("No user with this _id"));
            }
          },
          (err) => {
            return getAccessTokenReject(err);
          }
        );
      } else {
        //handle for verify errors
        return getAccessTokenReject(err);
      }
    });
  });
}

//a function to create user
async function createUser({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<Pick<RawUserDocType, "username">> {
  //check if username exist first

  const saltRounds = 10;

  const createUserPromise: Promise<Pick<RawUserDocType, "username">> =
    new Promise((createUserResolve, createUserReject) => {
      doesUsernameExist({ username }).then(
        async (userExist) => {
          if (!userExist) {
            await hash(password, saltRounds).then(
              async (generatedHash) => {
                await new UserModel({
                  username,
                  password: generatedHash,
                })
                  .save()
                  .then(
                    (userDoc) => {
                      createUserResolve(userDoc);
                    },
                    (err) => {
                      createUserReject(err);
                    }
                  );
              },
              (err) => {
                //handle problem with hashing the password
                if (process.env.NODE_ENV === "development") {
                  console.log(
                    `error while hashing user password, for more info-> ${err}`
                  );
                }

                return createUserReject(err);
              }
            );
          } else {
            return createUserReject(new Error("username_unavailable"));
          }
        },
        (err) => {
          return createUserReject(err);
        }
      );
    });

  if (process.env.NODE_ENV === "development") {
    console.log(
      `createUser called time: ${new Date(Date.now()).toISOString()}`
    );
  }

  return createUserPromise;
}

function verifyRefreshToken(
  refreshToken: string
): Promise<{ isVerified: boolean; isValid: boolean }> {
  return new Promise((resolve, reject) => {
    let isValid = false;
    let isVerified = false;

    jwt.verify(
      refreshToken,
      user_refresh_auth_key,
      (err, decodedPayload: any) => {
        if (!err) {
          isVerified = true;

          UserModel.findById(decodedPayload.userId, "refreshTokens").then(
            (userDoc) => {
              if (userDoc?.refreshTokens.includes(refreshToken)) isValid = true;

              resolve({ isVerified, isValid });
            },
            (err) => {
              console.log(err);
              reject(err);
            }
          );
        } else {
          console.log(err);
          resolve({ isVerified, isValid });
        }
      }
    );
  });
}

function logoutService(userId: string, refreshToken: string): Promise<boolean> {
  return new Promise((logoutResolve, logoutReject) => {
    UserModel.findById(userId).then(
      (userDoc) => {
        if (userDoc) {
          userDoc.refreshTokens = userDoc.refreshTokens.filter((eachToken) => {
            return refreshToken != eachToken;
          });

          userDoc.save().then(
            () => {
              logoutResolve(true);
            },
            (err) => {
              logoutReject(err);
            }
          );
        } else {
          logoutReject(new Error("no_matching_user"));
        }
      },
      (err) => {
        logoutReject(err);
      }
    );
  });
}

export {
  createUser,
  authUser,
  getAccessToken,
  logoutService,
  verifyRefreshToken,
};
