import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/database.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class ContactsService {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<typeof schema>) {}
  async findAll() { return this.db.query.contacts.findMany({ with: { company: true }, orderBy: [desc(schema.contacts.createdAt)] }); }
  async findOne(id: number) { return this.db.query.contacts.findFirst({ where: eq(schema.contacts.id, id), with: { company: true } }); }
  async create(data: any) { const [result] = await this.db.insert(schema.contacts).values(data); return this.findOne(result.insertId); }
  async update(id: number, data: any) { await this.db.update(schema.contacts).set(data).where(eq(schema.contacts.id, id)); return this.findOne(id); }
  async remove(id: number) { await this.db.delete(schema.contacts).where(eq(schema.contacts.id, id)); return { success: true }; }
}
