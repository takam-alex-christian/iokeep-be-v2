# iokeep-be-v2 — API Reference

Documentation for every endpoint exposed by the IOKEEP backend (Notes / Folders / Users + JWT auth API).

## Table of Contents

- [Conventions](#conventions)
- [Authentication](#authentication)
  - [POST /auth/signup](#post-authsignup)
  - [POST /auth/login](#post-authlogin)
  - [POST /auth/refresh_token](#post-authrefresh_token)
  - [PATCH /auth/logout](#patch-authlogout)
  - [POST /auth/access_token](#post-authaccess_token)
  - [GET /auth/access_token](#get-authaccess_token)
- [Folders](#folders)
  - [POST /folders](#post-folders)
  - [GET /folders](#get-folders)
  - [PATCH /folders/:folderId](#patch-foldersfolderid)
  - [DELETE /folders/:folderId](#delete-foldersfolderid)
- [Notes](#notes)
  - [POST /notes](#post-notes)
  - [GET /notes](#get-notes)
  - [GET /notes/:noteId](#get-notesnoteid)
  - [PATCH /notes/:noteId](#patch-notesnoteid)
  - [DELETE /notes/:noteId](#delete-notesnoteid)
- [Health](#health)
  - [GET /health](#get-health)
- [Known Quirks & Gotchas](#known-quirks--gotchas)

---

## Conventions

- **Base URL:** `http://localhost:4000` (configurable via the `PORT` environment variable; default `4000`)
- **Content type:** requests with a body must be `application/json` (form-urlencoded is also parsed, but all endpoints read from the JSON body parser)
- **Cookies:** authentication is cookie-based. A successful login sets two `HttpOnly` cookies:
  - `access_token` — JWT signed with `USER_AUTH_KEY`, cookie lifetime **10 minutes**
  - `refresh_token` — JWT signed with `USER_REFRESH_AUTH_KEY`, cookie lifetime **30 days**
- **Auth guard:** every route under `/folders` and `/notes` runs through `checkAccessToken`, which requires **both** cookies on protected requests. `GET` requests are allowed through without cookies (treated as "public" access), and access control is then applied per-resource.
- **IDs:** all entity ids are UUID strings (PostgreSQL). This is a breaking change from the previous Mongo `ObjectId` hex strings — clients must treat ids as opaque strings.
- **Fallbacks:** unmatched `GET` routes return `404`; unmatched routes for other methods return `405`.
- Response bodies use JSON with common shapes described per endpoint. `timeStamp` fields are Unix epoch milliseconds.

---

## Authentication

### POST /auth/signup

Create a new user account.

#### Input

| Location | Field      | Type   | Required | Description            |
|----------|------------|--------|----------|------------------------|
| body     | `username` | string | yes      | Unique username        |
| body     | `password` | string | yes      | Plaintext password (hashed server-side with bcrypt) |

No headers or cookies required.

#### Output

| Status | Body |
|--------|------|
| 200 | `{ "success": true, "userData": { "username": string }, "error": null }` |
| 400 | `{ "success": false, "userData": null, "error": { "message": "Bad Request! username and or password not provided" } }` |
| 200 | Duplicate username: `{ "success": false, "userData": null, "error": { "message": "username_unavailable" } }` |
| 500 | `{ "success": false, "userData": null, "error": { "message": "Server Error" } }` |

> ⚠️ Note: a duplicate username returns HTTP **200** with `success: false` (the controller never sets a non-200 status for this case).

#### Sample request

```bash
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "johndoe", "password": "secret123"}'
```

#### Sample response (201-era style, actually 200)

```json
{
  "success": true,
  "userData": { "username": "johndoe" },
  "error": null
}
```

---

### POST /auth/login

Authenticate a user. On success, sets `access_token` and `refresh_token` cookies.

#### Input

| Location | Field      | Type   | Required | Description |
|----------|------------|--------|----------|-------------|
| body     | `username` | string | yes      | Username    |
| body     | `password` | string | yes      | Password    |

#### Output

| Status | Body |
|--------|------|
| 200 | Success: `{ "success": true, "userData": { "username": string }, "error": null }` + `Set-Cookie: access_token=...; HttpOnly` + `Set-Cookie: refresh_token=...; HttpOnly` |
| 200 | Wrong password: `{ "success": false, "userData": null, "error": { "message": "Password incorrect" } }` |
| 200 | Unknown user: `{ "success": false, "userData": null, "error": { "message": "user_not_found" } }` |
| 200 | Missing fields: `{ "success": false, "userData": null, "error": { "message": "Bad Request! You must provide username & password" } }` |

> ⚠️ Note: all failure cases still return HTTP **200**.

#### Sample request

```bash
curl -i -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "johndoe", "password": "secret123"}'
```

#### Sample response

```http
HTTP/1.1 200 OK
Set-Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Max-Age=600; Path=/; HttpOnly
Set-Cookie: refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Max-Age=2592000; Path=/; HttpOnly
Content-Type: application/json; charset=utf-8
```

```json
{
  "success": true,
  "userData": { "username": "johndoe" },
  "error": null
}
```

---

### POST /auth/refresh_token

Verify that a refresh token is both cryptographically valid and still present in the user's token store (i.e. not invalidated by logout).

#### Input

| Location | Field           | Type   | Required | Description                              |
|----------|-----------------|--------|----------|------------------------------------------|
| header   | `Authorization` | string | yes      | `Bearer <refresh-token>` (value split on space, second segment used) |

#### Output

| Status | Body |
|--------|------|
| 200 | Valid + stored: `{ "success": true, "info": "Token authenticated", "error": null, "timeStamp": number }` |
| 200 | Valid signature but removed (logged out): `{ "success": false, "info": "Token Invalidated", "error": null, "timeStamp": number }` |
| 200 | Invalid/expired signature: `{ "success": false, "info": "", "error": null, "timeStamp": number }` |
| 400 | Missing header: `{ "success": false, "info": "", "error": { "message": "no refresh token found" }, "timeStamp": number }` |

#### Sample request

```bash
curl -X POST http://localhost:4000/auth/refresh_token \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Sample response

```json
{
  "success": true,
  "info": "Token authenticated",
  "error": null,
  "timeStamp": 1724001234567
}
```

---

### PATCH /auth/logout

Invalidate the current refresh token and clear both auth cookies.

#### Input

| Location | Field           | Type   | Required | Description                              |
|----------|-----------------|--------|----------|------------------------------------------|
| cookie   | `access_token`  | string | yes      | Must be valid; user id is taken from it  |
| cookie   | `refresh_token` | string | yes      | The token to remove from the user's store |

#### Output

| Status | Body |
|--------|------|
| 200 | Success: `{ "success": true, "info": "", "error": null, "timeStamp": number }` + both cookies cleared |
| 200 | User not found: `{ "success": false, "info": "No Matching user", "error": null, "timeStamp": number }` |
| 200 | Other failure: `{ "success": false, "info": "", "error": { "message": "Internal Server Error! please try again" }, "timeStamp": number }` |
| 401 | Missing/invalid cookies (guard): `{ "error": true, "message": "Login first" }` |
| 500 | Invalid access token (guard): `{ "error": true, "message": "invalid token" }` |

#### Sample request

```bash
curl -X PATCH http://localhost:4000/auth/logout \
  -b "access_token=eyJhbGciOi...; refresh_token=eyJhbGciOi..."
```

#### Sample response

```json
{
  "success": true,
  "info": "",
  "error": null,
  "timeStamp": 1724001234567
}
```

---

### POST /auth/access_token

Check whether the current `access_token` cookie is cryptographically valid.

#### Input

| Location | Field          | Type   | Required | Description          |
|----------|----------------|--------|----------|----------------------|
| cookie   | `access_token` | string | yes      | JWT to verify        |

#### Output

| Status | Body |
|--------|------|
| 200 | Valid: `{ "verified": true }` |
| 200 | Invalid: `{ "verified": false }` |
| 400 | No cookie: `{ "error": true, "errorMessage": "no access_token found" }` |

#### Sample request

```bash
curl -X POST http://localhost:4000/auth/access_token \
  -b "access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Sample response

```json
{ "verified": true }
```

---

### GET /auth/access_token

Mint a **new** `access_token` from the `refresh_token` cookie and set it as an updated cookie.

#### Input

| Location | Field           | Type   | Required | Description                |
|----------|-----------------|--------|----------|----------------------------|
| cookie   | `refresh_token` | string | yes      | Must be valid AND still present in the user's stored token list |

#### Output

| Status | Body |
|--------|------|
| 200 | Success: `{ "success": true, "info": "New access token generated", "error": null, "timeStamp": number }` + new `Set-Cookie: access_token=...; HttpOnly` |
| 403 | No cookie: `{ "success": false, "info": "", "error": { "message": "No Refresh Token" }, "timeStamp": number }` |
| 200 | Invalidated/expired token: `{ "success": false, "info": "", "error": { "message": "invalidated" }, "timeStamp": number }` |

> ⚠️ Note: token-verification failures return HTTP **200** with `success: false`.

#### Sample request

```bash
curl -i http://localhost:4000/auth/access_token \
  -b "refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Sample response

```http
HTTP/1.1 200 OK
Set-Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Max-Age=600; Path=/; HttpOnly
```

```json
{
  "success": true,
  "info": "New access token generated",
  "error": null,
  "timeStamp": 1724001234567
}
```

---

## Folders

All `/folders` routes are behind `checkAccessToken`. `GET /folders` additionally allows unauthenticated access (see quirks).

### POST /folders

Create a folder owned by the authenticated user.

#### Input

| Location | Field        | Type   | Required | Description                              |
|----------|--------------|--------|----------|------------------------------------------|
| cookie   | `access_token` | string | yes    | Valid JWT (user id used as owner)        |
| cookie   | `refresh_token`| string | yes    | Presence required by guard               |
| body     | `folderName` | string | yes      | Folder name (unique per owner)           |

#### Output

| Status | Body |
|--------|------|
| 201 | `{ "success": true, "info": "Folder created successfully!", "error": null, "data": { "folderId": string }, "timeStamp": number }` |
| 400 | `{ "success": false, "info": "", "error": { "message": "Bad Request! folderName field is missing" }, "data": null, "timeStamp": number }` |
| 500 | Duplicate name: `{ "success": false, "info": "", "error": { "message": "A folder Already exists with this folder name" }, "data": null, "timeStamp": number }` |
| 401 | Guard (no cookies): `{ "error": true, "message": "Login first" }` |

#### Sample request

```bash
curl -X POST http://localhost:4000/folders \
  -H "Content-Type: application/json" \
  -b "access_token=...; refresh_token=..." \
  -d '{"folderName": "Work"}'
```

#### Sample response

```json
{
  "success": true,
  "info": "Folder created successfully!",
  "error": null,
  "data": { "folderId": "4d8f0a2b-1c3e-4f5a-9b6d-7e8f0a1b2c3d" },
  "timeStamp": 1724001234567
}
```

---

### GET /folders

List all folders owned by the current user (or public listing when unauthenticated), each annotated with its note count (`size`).

#### Input

| Location | Field           | Type   | Required | Description                          |
|----------|-----------------|--------|----------|--------------------------------------|
| cookie   | `access_token`  | string | no\*     | \*See note below; determines ownership query |
| cookie   | `refresh_token` | string | no\*     | \*Presence required for the authenticated path |

Authenticated requests are scoped to `ownerId = <user id from access_token>`. Unauthenticated `GET` requests pass the guard with `userId = null`.

#### Output

| Status | Body |
|--------|------|
| 200 | Array of folder objects: `[{ "_id": string, "ownerId": string, "folderName": string, "creationDate": string, "lastOpenedDate": string, "lastModifiedDate": string, "isPublic": boolean, "__v": number, "size": number }]` |

`size` is the count of notes whose `folderId` matches this folder. If an authenticated user has no folders, a `"Default"` folder is created and returned (unauthenticated requests now fail — see quirks).

#### Sample request

```bash
curl http://localhost:4000/folders \
  -b "access_token=...; refresh_token=..."
```

#### Sample response

```json
[
  {
    "_id": "4d8f0a2b-1c3e-4f5a-9b6d-7e8f0a1b2c3d",
    "ownerId": "9a7b6c5d-4e3f-4a2b-9c1d-0e9f8a7b6c5d",
    "folderName": "Work",
    "creationDate": "2024-08-18T10:00:00.000Z",
    "lastOpenedDate": "2024-08-18T10:00:00.000Z",
    "lastModifiedDate": "2024-08-18T10:00:00.000Z",
    "isPublic": false,
    "__v": 0,
    "size": 3
  }
]
```

---

### PATCH /folders/:folderId

Update fields of a folder.

#### Input

| Location | Field          | Type   | Required | Description                                             |
|----------|----------------|--------|----------|---------------------------------------------------------|
| param    | `folderId`     | string | yes      | Folder id to update                                     |
| cookie   | `access_token` / `refresh_token` | string | yes | Auth guard                                               |
| body     | `folderObject` | object | yes      | Partial folder update: `{ "folderName"?: string, "lastModifiedDate"?: Date, "lastOpenedDate"?: Date, "isPublic"?: boolean }` |

#### Output

| Status | Body |
|--------|------|
| 200 | `{ "success": true, "error": null, "timeStamp": number }` |
| 400 | `{ "success": false, "error": { "message": "Bad Request! folderObject missing" }, "timeStamp": number }` |
| 500 | Folder id doesn't exist: `{ "success": false, "error": { "message": "Folder with provided id doesn't exist " }, "timeStamp": number }` |

#### Sample request

```bash
curl -X PATCH http://localhost:4000/folders/4d8f0a2b-1c3e-4f5a-9b6d-7e8f0a1b2c3d \
  -H "Content-Type: application/json" \
  -b "access_token=...; refresh_token=..." \
  -d '{"folderObject": {"folderName": "Personal", "isPublic": true}}'
```

#### Sample response

```json
{
  "success": true,
  "error": null,
  "timeStamp": 1724001234567
}
```

---

### DELETE /folders/:folderId

Delete a folder by id.

#### Input

| Location | Field      | Type   | Required | Description         |
|----------|------------|--------|----------|---------------------|
| param    | `folderId` | string | yes      | Folder id to delete |
| cookie   | `access_token` / `refresh_token` | string | yes | Auth guard |

#### Output

| Status | Body |
|--------|------|
| 200 | `{ "success": true, "error": null, "timeStamp": number }` |
| 500 | `{ "success": false, "error": { "message": "folder_does_not_exist" }, "timeStamp": number }` |

#### Sample request

```bash
curl -X DELETE http://localhost:4000/folders/4d8f0a2b-1c3e-4f5a-9b6d-7e8f0a1b2c3d \
  -b "access_token=...; refresh_token=..."
```

#### Sample response

```json
{
  "success": true,
  "error": null,
  "timeStamp": 1724001234567
}
```

---

## Notes

All `/notes` routes are behind `checkAccessToken`. `GET` requests additionally allow unauthenticated access with per-note access control.

### POST /notes

Create a note inside a folder.

#### Input

| Location | Field         | Type           | Required | Description                                     |
|----------|---------------|----------------|----------|-------------------------------------------------|
| body     | `folderId`    | string         | yes      | Parent folder id                                |
| body     | `editorState` | string         | yes      | Serialized editor content                       |
| body     | `description` | array of strings | yes    | Note description/tags list                      |
| cookie   | `access_token` / `refresh_token` | string | yes | Auth guard |

#### Output

| Status | Body |
|--------|------|
| 201 | `{ "success": true, "data": { "_id": string, "folderId": string, "isPublic": boolean, "description": string[], "creationDate": string, "lastOpenedDate": string, "lastModifiedDate": string, "__v": number }, "error": null, "timeStamp": number }` — note: `editorState` is deliberately omitted from the response |
| 400 | `{ "success": false, "data": null, "error": { "message": "Bad Request! editorState and or folderId not provided" }, "timeStamp": number }` |
| 500 | `{ "success": false, "data": null, "error": { "message": "Server Error! Retry again" }, "timeStamp": number }` |

#### Sample request

```bash
curl -X POST http://localhost:4000/notes \
  -H "Content-Type: application/json" \
  -b "access_token=...; refresh_token=..." \
  -d '{"folderId": "4d8f0a2b-1c3e-4f5a-9b6d-7e8f0a1b2c3d", "editorState": "<p>Meeting notes</p>", "description": ["work", "standup"]}'
```

#### Sample response

```json
{
  "success": true,
  "data": {
    "_id": "1f2e3d4c-5b6a-4f7e-8c9d-0e1f2a3b4c5d",
    "folderId": "4d8f0a2b-1c3e-4f5a-9b6d-7e8f0a1b2c3d",
    "isPublic": false,
    "description": ["work", "standup"],
    "creationDate": "2024-08-18T11:00:00.000Z",
    "lastOpenedDate": "2024-08-18T11:00:00.000Z",
    "lastModifiedDate": "2024-08-18T11:00:00.000Z",
    "__v": 0
  },
  "error": null,
  "timeStamp": 1724001234567
}
```

---

### GET /notes

List all notes in a folder.

#### Input

| Location | Field           | Type   | Required | Description                                              |
|----------|-----------------|--------|----------|----------------------------------------------------------|
| query    | `folderId`      | string | yes      | Parent folder id                                         |
| cookie   | `access_token` / `refresh_token` | string | no\* | \*If absent, the request is only served when the folder is `isPublic: true` |

#### Output

| Status | Body |
|--------|------|
| 200 | Array of full note docs: `[{ "_id", "folderId", "isPublic", "editorState", "description", "creationDate", "lastOpenedDate", "lastModifiedDate", "__v" }]` |
| 400 | Missing `folderId` query param → empty array `[]` with status 400 |
| 401 | Unauthenticated + folder not public → empty array `[]` |
| 500 | Server error → empty array `[]` with status 500 |

#### Sample request

```bash
curl "http://localhost:4000/notes?folderId=4d8f0a2b-1c3e-4f5a-9b6d-7e8f0a1b2c3d" \
  -b "access_token=...; refresh_token=..."
```

#### Sample response

```json
[
  {
    "_id": "1f2e3d4c-5b6a-4f7e-8c9d-0e1f2a3b4c5d",
    "folderId": "4d8f0a2b-1c3e-4f5a-9b6d-7e8f0a1b2c3d",
    "isPublic": false,
    "editorState": "<p>Meeting notes</p>",
    "description": ["work", "standup"],
    "creationDate": "2024-08-18T11:00:00.000Z",
    "lastOpenedDate": "2024-08-18T11:00:00.000Z",
    "lastModifiedDate": "2024-08-18T11:00:00.000Z",
    "__v": 0
  }
]
```

---

### GET /notes/:noteId

Fetch a single note, including its `editorState`.

#### Input

| Location | Field    | Type   | Required | Description |
|----------|----------|--------|----------|-------------|
| param    | `noteId` | string | yes      | Note id     |
| cookie   | `access_token` / `refresh_token` | string | no\* | \*Access granted if ANY of: note is `isPublic`, requester is authenticated, or parent folder is `isPublic` |

#### Output

| Status | Body |
|--------|------|
| 200 | Full note doc: `{ "data": { "_id", "folderId", "isPublic", "editorState", "description", "creationDate", "lastOpenedDate", "lastModifiedDate", "__v" }, "error": null, "timeStamp": number }` |
| 401 | `{ "data": null, "error": { "message": "You don't have access to this resource" }, "timeStamp": number }` |
| 500 | Nonexistent id: `{ "data": null, "error": { "message": "inexistent noteId" }, "timeStamp": number }` |

#### Sample request

```bash
curl http://localhost:4000/notes/1f2e3d4c-5b6a-4f7e-8c9d-0e1f2a3b4c5d \
  -b "access_token=...; refresh_token=..."
```

#### Sample response

```json
{
  "data": {
    "_id": "1f2e3d4c-5b6a-4f7e-8c9d-0e1f2a3b4c5d",
    "folderId": "4d8f0a2b-1c3e-4f5a-9b6d-7e8f0a1b2c3d",
    "isPublic": false,
    "editorState": "<p>Meeting notes</p>",
    "description": ["work", "standup"],
    "creationDate": "2024-08-18T11:00:00.000Z",
    "lastOpenedDate": "2024-08-18T11:00:00.000Z",
    "lastModifiedDate": "2024-08-18T11:00:00.000Z",
    "__v": 0
  },
  "error": null,
  "timeStamp": 1724001234567
}
```

---

### PATCH /notes/:noteId

Update fields of a note.

#### Input

| Location | Field      | Type   | Required | Description |
|----------|------------|--------|----------|-------------|
| param    | `noteId`   | string | yes      | Note id     |
| body     | `noteData` | object | yes      | Partial note update: `{ "editorState"?: string, "description"?: string[], "isPublic"?: boolean, "folderId"?: string }` |
| cookie   | `access_token` / `refresh_token` | string | yes | Auth guard |

Updating always refreshes `lastModifiedDate` server-side.

#### Output

| Status | Body |
|--------|------|
| 200 | `{ "success": true, "info": "Note updated Successfully!", "error": null, "timeStamp": number }` |
| 500 | Nonexistent note: `{ "success": false, "info": "", "error": { "message": "Server Error!" }, "timeStamp": number }` |
| 400 | Missing `noteId` param: `{ "success": false, "info": "", "error": { "message": "Bad Request! \n body => {eS: string}" }, "timeStamp": number }` |

#### Sample request

```bash
curl -X PATCH http://localhost:4000/notes/1f2e3d4c-5b6a-4f7e-8c9d-0e1f2a3b4c5d \
  -H "Content-Type: application/json" \
  -b "access_token=...; refresh_token=..." \
  -d '{"noteData": {"editorState": "<p>Updated notes</p>", "isPublic": true}}'
```

#### Sample response

```json
{
  "success": true,
  "info": "Note updated Successfully!",
  "error": null,
  "timeStamp": 1724001234567
}
```

---

### DELETE /notes/:noteId

Delete a note by id.

#### Input

| Location | Field    | Type   | Required | Description |
|----------|----------|--------|----------|-------------|
| param    | `noteId` | string | yes      | Note id     |
| cookie   | `access_token` / `refresh_token` | string | yes | Auth guard |

#### Output

| Status | Body |
|--------|------|
| 200 | `{ "success": true, "info": "", "error": null, "timeStamp": number }` |
| 500 | `{ "success": false, "info": "", "error": { "message": "Server Error!" }, "timeStamp": number }` |

#### Sample request

```bash
curl -X DELETE http://localhost:4000/notes/1f2e3d4c-5b6a-4f7e-8c9d-0e1f2a3b4c5d \
  -b "access_token=...; refresh_token=..."
```

#### Sample response

```json
{
  "success": true,
  "info": "",
  "error": null,
  "timeStamp": 1724001234567
}
```

---

## Health

### GET /health

Service health probe. Registered **before** the catch-all handlers, so it always responds.

#### Input

None — no headers, cookies, or body required.

#### Output

| Status | Body |
|--------|------|
| 200 | `{ "status": "ok", "service": "iokeep-backend-service" }` |

#### Sample request

```bash
curl http://localhost:4000/health
```

#### Sample response

```json
{ "status": "ok", "service": "iokeep-backend-service" }
```

---

## Known Quirks & Gotchas

Documented as-implemented; some of these are bugs you should know about before integrating:

1. **Auth endpoints return 200 on failure.** `/auth/login` (wrong password, unknown user, missing fields), `/auth/signup` (duplicate username), and `GET /auth/access_token` (invalid token) all return HTTP 200 with `success: false`. Only status codes you can rely on: `400` for missing bodies/cookies/headers and `500` for genuine server errors.
2. **Guard error shapes differ.** `checkAccessToken` returns `{ "error": true, "message": "Login first" }` (401) when cookies are missing and `{ "error": true, "message": "invalid token" }` (500) when the access token fails verification — different from every controller's response shape, and invalid tokens incorrectly produce a 500.
3. **Both cookies required for the guard.** Protected non-GET requests need `access_token` AND `refresh_token` present, otherwise 401 — even though only the access token is verified.
4. **`GET /folders` unauthenticated now fails.** The old Mongo code created a `"Default"` folder with a null owner for unauthenticated callers. With Postgres that owner is a required FK, so the attempt throws and the endpoint returns **500 with an empty array**. Authenticated users with no folders still get a `"Default"` folder created for them.
5. **No per-resource authorization on writes.** Any authenticated user can `PATCH`/`DELETE` any `folderId` or `noteId` — there are no ownership checks on update/delete. Only reads apply access control.
6. **Cascade deletes are now enforced by the database.** Deleting a folder deletes its notes; deleting a user deletes their folders and notes (`onDelete: Cascade` in the Prisma schema). The old Mongo behavior of leaving orphaned notes is gone.
7. **`POST /notes` requires `description`** as well as `editorState` and `folderId`, but the 400 error message only mentions the latter two.
8. **No input validation.** Beyond presence checks, there is no schema validation on bodies; invalid values produce 500s from Mongoose/JSON parse errors.
9. **`POST /auth/access_token`** (`verifyAccessTokenController`) is flagged in source comments as "to be deleted" — prefer `GET /auth/access_token` for token renewal.
10. **Access token from login has no JWT `expiresIn`.** Only the cookie expires (10 min). Tokens minted by `GET /auth/access_token` do carry `expiresIn: 10m`.
11. **Unauthenticated `GET /notes` with a nonexistent `folderId` hangs.** `isFolderPublic` throws on a missing folder and the rejection is unhandled in `readNotesController`, so the request never receives a response. Only use valid folder ids for public (unauthenticated) reads.
12. **Refresh tokens never expire server-side.** `refresh_token` JWTs are signed without `expiresIn` — only the 30-day cookie caps their lifetime. Each login appends another token to the user's stored list.
