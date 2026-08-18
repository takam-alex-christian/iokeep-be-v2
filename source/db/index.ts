import { prisma, connectDatabase } from "./client";

import PrismaUserRepository from "./repositories/user.repository";
import PrismaFolderRepository from "./repositories/folder.repository";
import PrismaNoteRepository from "./repositories/note.repository";

// Composition root: this is the single place where a concrete repository
// implementation is chosen. To swap the database later, replace these
// implementations (or add a new backend) without touching services/controllers.
const repositories = {
  users: new PrismaUserRepository(),
  folders: new PrismaFolderRepository(),
  notes: new PrismaNoteRepository(),
};

export { repositories, prisma, connectDatabase };
