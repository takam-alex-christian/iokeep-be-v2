// Domain types (decoupled from any ORM) and the persistence contract for Users.

type User = {
  id: string;
  username: string;
  password: string;
  refreshTokens: string[];
  creationDate: Date;
};

type NewUser = {
  username: string;
  password: string;
};

interface IUserRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;
  addRefreshToken(userId: string, token: string): Promise<void>;
  removeRefreshToken(userId: string, token: string): Promise<void>;
}

export type { User, NewUser, IUserRepository };
