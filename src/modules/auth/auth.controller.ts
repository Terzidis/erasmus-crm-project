import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { username: string; openId: string }, @Res() res: Response) {
    const result = await this.authService.login(body.username, body.openId);
    res.cookie('session', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.send(result);
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('session');
    return res.send({ success: true });
  }
}
