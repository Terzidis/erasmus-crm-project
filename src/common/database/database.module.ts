import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import * as schema from '../../../drizzle/schema';

export const DRIZZLE = 'DRIZZLE';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: async (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL');
        const connection = await mysql.createConnection(connectionString);
        return drizzle(connection, { schema, mode: 'default' });
      },
      inject: [ConfigService],
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
