import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/database.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class CompaniesService {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<typeof schema>) {}
  async findAll() { return this.db.query.companies.findMany({ orderBy: [desc(schema.companies.createdAt)] }); }
  async findOne(id: number) { return this.db.query.companies.findFirst({ where: eq(schema.companies.id, id) }); }
  async create(data: any) { const [result] = await this.db.insert(schema.companies).values(data); return this.findOne(result.insertId); }
  async update(id: number, data: any) { await this.db.update(schema.companies).set(data).where(eq(schema.companies.id, id)); return this.findOne(id); }
  async remove(id: number) { await this.db.delete(schema.companies).where(eq(schema.companies.id, id)); return { success: true }; }
}
