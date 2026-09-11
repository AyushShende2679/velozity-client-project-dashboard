import { prisma } from '../config/db';

export class ClientService {
  static async listClients() {
    return prisma.client.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });
  }

  static async createClient(data: { name: string; email?: string; company?: string }) {
    return prisma.client.create({
      data,
    });
  }
}
