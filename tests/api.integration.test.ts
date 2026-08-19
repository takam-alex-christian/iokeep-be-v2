// API-level integration tests: boot a real instance of the server on an
// ephemeral port, drive it with genuine HTTP requests (Node fetch), and assert
// that status codes + JSON bodies match the contract in `openapi.yaml`.
//
// Because the app connects to PostgreSQL via Prisma at import time, these tests
// require a reachable database with the schema applied. See `tests/README.md`
// (or the error below) for the one-time setup.

import type { Server } from "http";
import type { AddressInfo } from "net";

import expressApp from "../source/app";
import { prisma } from "../source/db";

import { HttpClient } from "./helpers/httpClient";

describe("IOKEEP API (HTTP integration)", () => {
  let server: Server;
  let baseUrl: string;
  let client: HttpClient;

  // Unique per run so repeated executions never collide on the `username`
  // unique constraint (which signup surfaces as `username_unavailable`).
  const username = `it_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const password = "SuperSecret123!";
  const folderName = `Work-${username}`;

  let folderId: string;
  let noteId: string;

  async function waitForDatabase(timeoutMs = 15000): Promise<void> {
    const started = Date.now();
    let lastErr: unknown;

    while (Date.now() - started < timeoutMs) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return;
      } catch (err) {
        lastErr = err;
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    throw new Error(
      "PostgreSQL is not reachable. Start it, then push the schema:\n" +
        "  docker compose -f docker-compose.test.yml up -d\n" +
        "  npx prisma db push --skip-generate\n\n" +
        `Last connection error: ${String(lastErr)}`
    );
  }

  beforeAll(async () => {
    await waitForDatabase();

    await new Promise<void>((resolve) => {
      server = expressApp.listen(0, resolve);
    });

    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
    client = new HttpClient(baseUrl);
  }, 30000);

  afterAll(async () => {
    // Remove the test user; folder/note rows cascade via the FK relations.
    await prisma.user.deleteMany({ where: { username } });
    await prisma.$disconnect();

    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }, 30000);

  // ---------------------------------------------------------------- health --

  test("GET /health reports the service is up", async () => {
    const res = await client.get("/health");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: "ok",
      service: "iokeep-backend-service",
    });
  });

  // ------------------------------------------------------------------ auth --

  test("POST /auth/signup without a password returns 400", async () => {
    const res = await client.post("/auth/signup", { username });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toBe(
      "Bad Request! username and or password not provided"
    );
  });

  test("POST /auth/signup creates a user", async () => {
    const res = await client.post("/auth/signup", { username, password });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.userData).toEqual({ username });
    expect(body.error).toBeNull();
  });

  test("POST /auth/signup rejects a duplicate username (200 quirk)", async () => {
    const res = await client.post("/auth/signup", { username, password });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toBe("username_unavailable");
  });

  test("POST /auth/login with a wrong password fails softly (200 quirk)", async () => {
    const res = await client.post("/auth/login", {
      username,
      password: "not-the-password",
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toBe("Password incorrect");
  });

  test("POST /auth/login with an unknown user fails softly (200 quirk)", async () => {
    const res = await client.post("/auth/login", {
      username: `ghost_${username}`,
      password,
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toBe("user_not_found");
  });

  test("POST /auth/login authenticates and sets both auth cookies", async () => {
    const res = await client.post("/auth/login", { username, password });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.userData).toEqual({ username });

    const setCookies = res.headers.getSetCookie();
    expect(setCookies.some((c) => c.startsWith("access_token="))).toBe(true);
    expect(setCookies.some((c) => c.startsWith("refresh_token="))).toBe(true);

    // The jar must now hold both tokens for subsequent guarded requests.
    expect(client.getCookie("access_token")).toBeTruthy();
    expect(client.getCookie("refresh_token")).toBeTruthy();
  });

  test("POST /auth/access_token verifies the current access cookie", async () => {
    const res = await client.post("/auth/access_token");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ verified: true });
  });

  test("GET /auth/access_token mints a new access token from the refresh cookie", async () => {
    const res = await client.get("/auth/access_token");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.info).toBe("New access token generated");
    expect(res.headers.getSetCookie().some((c) => c.startsWith("access_token="))).toBe(true);
  });

  test("POST /auth/refresh_token authenticates a valid refresh token", async () => {
    const refreshToken = client.getCookie("refresh_token");
    expect(refreshToken).toBeTruthy();

    const res = await client.post("/auth/refresh_token", undefined, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.info).toBe("Token authenticated");
  });

  // --------------------------------------------------------------- folders --

  test("POST /folders unauthenticated is blocked by the guard (401)", async () => {
    const anon = new HttpClient(baseUrl);
    const res = await anon.post("/folders", { folderName });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: true, message: "Login first" });
  });

  test("POST /folders without folderName returns 400", async () => {
    const res = await client.post("/folders", {});

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toBe("Bad Request! folderName field is missing");
  });

  test("POST /folders creates a folder (201)", async () => {
    const res = await client.post("/folders", { folderName });

    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.info).toBe("Folder created successfully!");
    expect(typeof body.data.folderId).toBe("string");
    folderId = body.data.folderId;
  });

  test("POST /folders with a duplicate name returns 500", async () => {
    const res = await client.post("/folders", { folderName });

    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error.message).toBe("A folder Already exists with this folder name");
  });

  test("GET /folders lists folders with a note-count size", async () => {
    const res = await client.get("/folders");

    expect(res.status).toBe(200);

    const folders = await res.json();
    expect(Array.isArray(folders)).toBe(true);

    const created = folders.find((f: { _id: string }) => f._id === folderId);
    expect(created).toBeDefined();
    expect(created.folderName).toBe(folderName);
    expect(created.isPublic).toBe(false);
    expect(typeof created.size).toBe("number");
  });

  test("PATCH /folders/:id updates a folder", async () => {
    const res = await client.patch(`/folders/${folderId}`, {
      folderObject: { folderName: `Work-updated-${username}` },
    });

    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  test("PATCH /folders/:id without folderObject returns 400", async () => {
    const res = await client.patch(`/folders/${folderId}`, {});

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error.message).toBe("Bad Request! folderObject missing");
  });

  // ----------------------------------------------------------------- notes --

  test("POST /notes with missing fields returns 400", async () => {
    const res = await client.post("/notes", { folderId });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toBe(
      "Bad Request! editorState and or folderId not provided"
    );
  });

  test("POST /notes creates a note (editorState omitted from summary)", async () => {
    const res = await client.post("/notes", {
      folderId,
      editorState: "<p>Meeting notes</p>",
      description: ["work", "standup"],
    });

    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.folderId).toBe(folderId);
    expect(body.data.description).toEqual(["work", "standup"]);
    expect(typeof body.data._id).toBe("string");
    expect(body.data.editorState).toBeUndefined();

    noteId = body.data._id;
  });

  test("GET /notes lists a folder's notes including editorState", async () => {
    const res = await client.get(`/notes?folderId=${folderId}`);

    expect(res.status).toBe(200);

    const notes = await res.json();
    expect(Array.isArray(notes)).toBe(true);

    const note = notes.find((n: { _id: string }) => n._id === noteId);
    expect(note).toBeDefined();
    expect(note.editorState).toBe("<p>Meeting notes</p>");
  });

  test("GET /notes unauthenticated is blocked by the guard (401)", async () => {
    const anon = new HttpClient(baseUrl);
    const res = await anon.get(`/notes?folderId=${folderId}`);

    // The guard's path match (`originalUrl.split("/")[1]`) sees the query
    // string as part of the segment, so it never grants the public-resource
    // bypass here and returns "Login first" — not the empty-array 401 the
    // spec documents for the (unreachable) non-public folder branch.
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: true, message: "Login first" });
  });

  test("GET /notes/:id returns a single note with editorState", async () => {
    const res = await client.get(`/notes/${noteId}`);

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data._id).toBe(noteId);
    expect(body.data.editorState).toBe("<p>Meeting notes</p>");
  });

  test("PATCH /notes/:id updates a note", async () => {
    const res = await client.patch(`/notes/${noteId}`, {
      noteData: { editorState: "<p>Updated notes</p>", description: ["work"] },
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.info).toBe("Note updated Successfully!");
  });

  test("GET /notes/:id reflects the update", async () => {
    const res = await client.get(`/notes/${noteId}`);

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.editorState).toBe("<p>Updated notes</p>");
  });

  test("DELETE /notes/:id deletes a note", async () => {
    const res = await client.del(`/notes/${noteId}`);

    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  test("GET /notes/:id for a missing note returns 500", async () => {
    const res = await client.get(`/notes/${noteId}`);

    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error.message).toBe("inexistent noteId");
  });

  // ---------------------------------------------------- folder deletion -----

  test("DELETE /folders/:id deletes a folder", async () => {
    const res = await client.del(`/folders/${folderId}`);

    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  test("DELETE /folders/:id for a missing folder returns 500", async () => {
    const res = await client.del(`/folders/${folderId}`);

    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error.message).toBe("folder_does_not_exist");
  });

  // ----------------------------------------------------------------- logout --

  test("PATCH /auth/logout clears the session (runs last)", async () => {
    const res = await client.patch("/auth/logout");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
