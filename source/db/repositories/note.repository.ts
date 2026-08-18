import { prisma } from "../client";

import type {
  INoteRepository,
  NewNote,
  Note,
  NoteUpdate,
} from "../../features/noteManager/note.repository.interface";

class PrismaNoteRepository implements INoteRepository {
  async create(data: NewNote): Promise<Note> {
    return prisma.note.create({ data });
  }

  async findByFolder(folderId: string): Promise<Note[]> {
    return prisma.note.findMany({ where: { folderId } });
  }

  async findById(noteId: string): Promise<Note | null> {
    return prisma.note.findUnique({ where: { id: noteId } });
  }

  async update(noteId: string, data: NoteUpdate): Promise<boolean> {
    const result = await prisma.note.updateMany({
      where: { id: noteId },
      data,
    });

    return result.count > 0;
  }

  async delete(noteId: string): Promise<boolean> {
    const result = await prisma.note.deleteMany({ where: { id: noteId } });
    return result.count > 0;
  }

  async countByFolderIds(folderIds: string[]): Promise<Map<string, number>> {
    const grouped = await prisma.note.groupBy({
      by: ["folderId"],
      where: { folderId: { in: folderIds } },
      _count: { _all: true },
    });

    const counts = new Map<string, number>();

    for (const row of grouped) {
      counts.set(row.folderId, row._count._all);
    }

    return counts;
  }
}

export default PrismaNoteRepository;
