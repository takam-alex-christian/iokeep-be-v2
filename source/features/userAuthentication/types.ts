type AuthJsonResponse = {
  success: boolean;
  info: string; // predominantly to inform the user
  error: {
    message: string;
  } | null;
  timeStamp: number; // can come in handy when tracking error
};

type UserAuthJsonResponseType = {
  success: boolean;
  userData: {
    username: string;
  } | null; // is null if success is false
  error: {
    message: string;
  } | null;
};

export type { AuthJsonResponse, UserAuthJsonResponseType };
