import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/database.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class ActivitiesService {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<typeof schema>) {}
  async findAll() { return this.db.query.activities.findMany({ with: { contact: true, deal: true }, orderBy: [desc(schema.activities.createdAt)] }); }
  async findOne(id: number) { return this.db.query.activities.findFirst({ where: eq(schema.activities.id, id), with: { contact: true, deal: true } }); }
  async create(data: any) { const [result] = await this.db.insert(schema.activities).values(data); return this.findOne(result.insertId); }
  async update(id: number, data: any) { await this.db.update(schema.activities).set(data).where(eq(schema.activities.id, id)); return this.findOne(id); }
  async remove(id: number) { await this.db.delete(schema.activities).where(eq(schema.activities.id, id)); return { success: true }; }
}
