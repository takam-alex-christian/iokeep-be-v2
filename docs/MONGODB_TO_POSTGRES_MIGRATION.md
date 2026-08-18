# MongoDB → PostgreSQL Migration

Documentation of the work performed to replace **MongoDB (Mongoose)** with **PostgreSQL (Prisma)**
in the IOKEEP backend (`iokeep-be-v2`), using a **Repository Pattern** so the database can be
swapped again later with minimal effort.

---

## 1. Summary

| | Before | After |
|---|---|---|
| Database | MongoDB | PostgreSQL |
| Data access | Mongoose (document ODM) | Prisma ORM v7.9.1 + `@prisma/adapter-pg` driver adapter |
| IDs | Mongo `ObjectId` (hex string) | UUID (`String @id @default(uuid())`) |
| Persistence coupling | Models imported directly into services | Services depend on **repository interfaces** only |
| Data migration | — | Start fresh (no data migrated) |

The migration was verified with:

- `npx tsc` → exit 0 (strict mode)
- `npx jest` → 1 test passed
- `npx prisma validate` → schema valid
- Compiled server boots and listens (`node dist/server.js`)

---

## 2. Goals

1. Replace MongoDB with PostgreSQL.
2. Adopt an architecture that makes changing the database later **easy**.
3. Preserve the existing HTTP API surface (response shapes, error messages, status codes, cookies, JWT payloads).

### Decisions taken (confirmed with the user)

- **ORM**: Prisma (schema-first, best TypeScript types, trivial SQL-vendor swap via `provider`).
- **ID strategy**: UUID.
- **Data migration**: start fresh (the app was in alpha; no production data to preserve).

---

## 3. Architecture

### Before (Mongoose)

Mongoose leaked into the whole stack — models were imported directly into services, which mutated
live documents and called `.save()`:

```
Controller ──► Service ──► Mongoose Model (directly imported)
```

This "load → mutate → save" pattern, `ObjectId`, `InferRawDocType`, and `_id.toString()` made the
database unswappable without rewriting every layer.

### After (Repository Pattern)

```
Controller ──► Service (factory) ──► Repository INTERFACE ──► Prisma implementation
                                                              (source/db/repositories)
```

- **Domain types** (`User`, `Folder`, `Note`) are plain TypeScript types — no ORM types.
- **Repository interfaces** define the persistence contract per entity.
- **Services** are factory functions that receive repositories (constructor injection) and depend
  only on the interfaces.
- **Composition root** (`source/db/index.ts`) is the *single* place a concrete backend is chosen.

#### How to swap the database later

Because services depend only on interfaces and everything is wired in one place, a future swap means:

1. Implement a new repository class per entity (e.g. `MongoUserRepository`, `MysqlUserRepository`).
2. Point the composition root at the new implementations.

No service or controller changes are required. Additionally, swapping between SQL vendors
(PostgreSQL ↔ MySQL ↔ SQLite) with Prisma is a one-line change (`provider = "..."` in
`prisma/schema.prisma`) plus regenerating the client.

---

## 4. Data model mapping

| Concept | MongoDB (Mongoose) | PostgreSQL (Prisma) |
|---|---|---|
| Primary key | `_id: ObjectId` | `id: String @id @default(uuid())` |
| `User.refreshTokens` | `[String]` array | `String[]` → `TEXT[]` |
| `Note.description` | `[String]` array | `String[]` → `TEXT[]` |
| `Folder.ownerId` | bare `ObjectId` | `String` + FK → `User.id` |
| `Note.folderId` | bare `ObjectId` | `String` + FK → `Folder.id` |
| Unique folder name per owner | enforced in service | `@@unique([ownerId, folderName])` (DB-enforced) |
| Delete semantics | no cascade (orphans left) | `onDelete: Cascade` (folder → notes, user → folders) |

### `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id            String   @id @default(uuid())
  username      String   @unique
  password      String
  refreshTokens String[]
  creationDate  DateTime @default(now())

  folders Folder[]
}

model Folder {
  id               String   @id @default(uuid())
  ownerId          String
  folderName       String
  creationDate     DateTime @default(now())
  lastOpenedDate   DateTime @default(now())
  lastModifiedDate DateTime @default(now())
  isPublic         Boolean  @default(false)

  owner User   @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  notes Note[]

  @@unique([ownerId, folderName])
}

model Note {
  id               String   @id @default(uuid())
  folderId         String
  isPublic         Boolean  @default(false)
  editorState      String
  description      String[]
  creationDate     DateTime @default(now())
  lastOpenedDate   DateTime @default(now())
  lastModifiedDate DateTime @default(now())

  folder Folder @relation(fields: [folderId], references: [id], onDelete: Cascade)
}
```

---

## 5. Prisma 7 specifics

Prisma **v7** changed significantly from v6. The following are used:

- **`prisma-client` generator** (replaces `prisma-client-js`), with an explicit `output` directory.
- **Driver adapter** — the runtime client requires `@prisma/adapter-pg`:

  ```ts
  import { PrismaPg } from "@prisma/adapter-pg";
  import { PrismaClient } from "../../generated/prisma/client";

  const adapter = new PrismaPg({ connectionString: database_url });
  const prisma = new PrismaClient({ adapter });
  ```

- **`prisma.config.ts`** — the CLI no longer auto-loads `.env`; config points at the schema,
  migrations path, and `DATABASE_URL`:

  ```ts
  import "dotenv/config";
  import { defineConfig } from "prisma/config";

  export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: { path: "prisma/migrations" },
    datasource: { url: process.env["DATABASE_URL"] },
  });
  ```

- **Generated client location**: `generated/prisma/` (gitignored; regenerated with `npx prisma generate`).

---

## 6. File-by-file change log

### Created

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Prisma schema (models above). |
| `prisma.config.ts` | Prisma 7 CLI configuration. |
| `.env` / `.env.example` | `DATABASE_URL`, `PORT`, JWT keys. |
| `source/db/client.ts` | Prisma singleton + `connectDatabase()`. |
| `source/db/index.ts` | **Composition root** — wires concrete repositories. |
| `source/db/repositories/user.repository.ts` | `PrismaUserRepository`. |
| `source/db/repositories/folder.repository.ts` | `PrismaFolderRepository`. |
| `source/db/repositories/note.repository.ts` | `PrismaNoteRepository`. |
| `source/features/userAuthentication/user.repository.interface.ts` | `User`, `NewUser`, `IUserRepository`. |
| `source/features/folderManager/folder.repository.interface.ts` | `Folder`, `NewFolder`, `FolderUpdate`, `IFolderRepository`. |
| `source/features/noteManager/note.repository.interface.ts` | `Note`, `NewNote`, `NoteUpdate`, `INoteRepository`. |

### Modified

| File | Change |
|---|---|
| `source/config/config.ts` | `mongodb_uri` → `database_url`. |
| `source/app.ts` | `connectDB()` → `connectDatabase()`. |
| `source/features/userAuthentication/auth.services.ts` | Rewritten as `createAuthService(userRepo)` factory; promise-pyramid → async/await. |
| `source/features/userAuthentication/auth.controller.ts` | Wires `createAuthService(repositories.users)`. |
| `source/features/folderManager/fm.services.ts` | Rewritten as `createFolderService(folderRepo, noteRepo)` factory. |
| `source/features/folderManager/fm.controllers.ts` | Wires folder service; `_id` mapping. |
| `source/features/folderManager/types.ts` | `FolderJson` + response types (`_id`-based). |
| `source/features/noteManager/nm.services.ts` | Rewritten as `createNoteService(noteRepo, folderRepo)` factory; `isFolderPublic` moved here. |
| `source/features/noteManager/nm.controllers.ts` | Wires note service; `_id` mapping. |
| `source/features/noteManager/types.ts` | `NoteJson`/`NoteSummaryJson` + response types (`_id`-based). |
| `package.json` | Added `@prisma/client`, `prisma`, `@prisma/adapter-pg`; removed `mongoose`. |
| `.gitignore` | Added `generated/`. |

### Deleted

| File | Reason |
|---|---|
| `source/config/db.ts` | Mongoose connection (replaced by `source/db/client.ts`). |
| `source/features/userAuthentication/auth.model.ts` | Mongoose `User` model. |
| `source/features/folderManager/fm.model.ts` | Mongoose `Folder` model. |
| `source/features/noteManager/nm.model.ts` | Mongoose `Note` model. |

---

## 7. Repository abstraction (key example)

**Interface** (`user.repository.interface.ts`):

```ts
type User = {
  id: string;
  username: string;
  password: string;
  refreshTokens: string[];
  creationDate: Date;
};

interface IUserRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;
  addRefreshToken(userId: string, token: string): Promise<void>;
  removeRefreshToken(userId: string, token: string): Promise<void>;
}
```

**Implementation** (`db/repositories/user.repository.ts`):

```ts
class PrismaUserRepository implements IUserRepository {
  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  }
  // ...findById, create, addRefreshToken (refreshTokens: { push: token }),
  //    removeRefreshToken (refreshTokens: { set: filtered })
}
```

**Composition root** (`db/index.ts`):

```ts
const repositories = {
  users: new PrismaUserRepository(),
  folders: new PrismaFolderRepository(),
  notes: new PrismaNoteRepository(),
};
```

**Service** (`auth.services.ts`) — depends only on the interface:

```ts
function createAuthService(userRepo: IUserRepository) {
  async function authUser({ username, password }) { /* uses userRepo */ }
  // ...
  return { createUser, authUser, getAccessToken, logoutService, verifyRefreshToken };
}
```

**Controller** — wires service with the concrete repository:

```ts
const authService = createAuthService(repositories.users);
```

`IUserRepository` uses scalar-list operators that map to PostgreSQL arrays:
`refreshTokens: { push: token }` and `refreshTokens: { set: [...] }`.

---

## 8. Behavior notes / caveats

- **IDs are now UUIDs, not Mongo ObjectId hex strings.** This is a breaking change for any client
  that assumed ObjectId format. IDs remain opaque strings, so clients treating them as opaque are
  unaffected.
- **Existing JWTs are invalidated.** Tokens carry `userId` (previously an ObjectId). After
  migration, existing tokens fail to match a UUID `id` — users simply re-login.
- **`onDelete: Cascade`** was added: deleting a folder deletes its notes; deleting a user deletes
  their folders and notes. The old Mongoose code left orphaned documents.
- **API compatibility preserved**: JSON responses still expose `_id` (mapped from the internal
  `id`), and error messages / status codes / cookie names are unchanged.

### Bugs fixed during the migration

1. **`deleteFolder` double-delete** — the old service ran both `findByIdAndDelete` and a
   `deleteOne` path. Now a single `deleteMany`.
2. **N+1 query in `countNotesByFolderIds`** — replaced the per-folder `countDocuments` loop with a
   single `groupBy` (`countByFolderIds`).

---

## 9. Setup & run instructions

1. **Start PostgreSQL** (not installed on the target machine at time of writing), e.g.:

   ```bash
   docker run -d -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres
   # or: brew install postgresql && brew services start postgresql
   ```

2. **Configure `.env`** (copy from `.env.example`):

   ```dotenv
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/iokeepv2?schema=public"
   ```

3. **Create & apply the migration** (creates tables + regenerates the client):

   ```bash
   npx prisma migrate dev --name init
   ```

4. **Build & run**:

   ```bash
   npm run build      # npx tsc → dist/
   npm run start      # sudo pm2 start ./dist/server.js
   ```

Useful Prisma commands:

```bash
npx prisma generate   # regenerate the client after schema changes
npx prisma migrate dev --name <name>   # create + apply a migration
npx prisma studio     # browse data in the browser
```

---

## 10. Verification checklist

- [x] `npx tsc` — clean, strict mode, exit 0.
- [x] `npx jest` — 1 test passed.
- [x] `npx prisma validate` — schema valid.
- [x] Compiled server boots and listens (`node dist/server.js`).
- [ ] Migration applied to a live PostgreSQL database (pending a running Postgres instance).
- [ ] End-to-end smoke test (signup → login → folder CRUD → note CRUD) against a live database.
