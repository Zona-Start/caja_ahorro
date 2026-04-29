import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { sessions } from '@/database/schema';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class SessionsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
  ) {}

  async getAll(userId: string): Promise<any[]> {
    return await this.db.query.sessions.findMany({
      where: eq(sessions.userId, userId),
      orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
    });
  }

  async findById(id: string): Promise<any | null> {
    return await this.db.query.sessions.findFirst({
      where: eq(sessions.id, id),
    });
  }

  async revoke(id: string, userId: string, reason: string): Promise<void> {
    const session = await this.findById(id);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.db
      .update(sessions)
      .set({
        revokedAt: new Date(),
        revokedReason: reason,
      })
      .where(eq(sessions.id, id));
  }

  async revokeAll(userId: string, reason: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({
        revokedAt: new Date(),
        revokedReason: reason,
      })
      .where(eq(sessions.userId, userId));
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    await this.db.execute(
      `DELETE FROM sessions 
      WHERE refresh_token_expires_at < $1 
      AND revoked_at IS NULL`,
    );
  }
}
