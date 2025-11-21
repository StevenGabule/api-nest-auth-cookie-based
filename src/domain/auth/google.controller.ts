/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Controller,
  Get,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from '@nestjs/common';

import { AuthService } from './auth.service';
import { GoogleOauthGuard } from './guards/google_auth.guard';

@Controller('auth/google')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
@ApiTags('auth-google')
export class GoogleController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(GoogleOauthGuard)
  async googleAuth() {}

  @Get('callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthRedirect(@Request() req: any, @Response() res: any) {
    const response = await this.authService.createGoogleToken(req.user);
    res.cookie('access_token', response.access_token, {
      httpOnly: true,
      sameSite: 'lax',
    });
    res.cookie('refresh_token', response.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
    });
    return res.redirect(`http://localhost:3000`);
  }
}
