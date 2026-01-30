import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/database.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class DealsService {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<typeof schema>) {}
  async findAll() { return this.db.query.deals.findMany({ with: { company: true, contact: true }, orderBy: [desc(schema.deals.createdAt)] }); }
  async findOne(id: number) { return this.db.query.deals.findFirst({ where: eq(schema.deals.id, id), with: { company: true, contact: true } }); }
  async create(data: any) { const [result] = await this.db.insert(schema.deals).values(data); return this.findOne(result.insertId); }
  async update(id: number, data: any) { await this.db.update(schema.deals).set(data).where(eq(schema.deals.id, id)); return this.findOne(id); }
  async remove(id: number) { await this.db.delete(schema.deals).where(eq(schema.deals.id, id)); return { success: true }; }
}
