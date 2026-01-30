import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/database.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../../../drizzle/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<typeof schema>,
    private jwtService: JwtService,
  ) {}

  async login(username: string, openId: string) {
    let user = await this.db.query.users.findFirst({
      where: eq(schema.users.openId, openId),
    });

      const [newUser] = await this.db.insert(schema.users).values({
        openId,
        name: username,
        role: 'user',
      });
      user = await this.db.query.users.findFirst({
        where: eq(schema.users.id, newUser.insertId),
      });
    }

    const payload = { sub: user.id, username: user.name, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
