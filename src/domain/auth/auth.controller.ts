/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { AuthService } from './auth.service';
import { UserSigInDto } from './dto/auth-request.dto';
import { UserSignInResponseDto } from './dto/auth-response.dto';
import { RefreshTokenGuard } from './guards/refresh_token.guard';
import { AccessTokenGuard } from './guards/access_token.guard';
import { UserEntity } from '../user/entity/user.entity';

@ApiBearerAuth('authorization')
@Controller('auth')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // define all our user routes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ description: 'user login api returns access token' })
  @ApiOkResponse({
    description: 'user has been login successfully',
    type: UserSignInResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'internal server error occurred',
  })
  @ApiBadRequestResponse({ description: 'bad request' })
  @ApiConsumes('application/json')
  @Post('/login')
  public async Login(
    @Body() body: UserSigInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.validateUserByPassword(body);

    res.cookie('access_token', token.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1d
    });

    res.cookie('refresh_token', token.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7days
    });

    return {
      message: 'Login successful',
      token,
    };
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('application/json')
  @Post('/logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const user = req.user as UserEntity;

    // Clear refresh token
    await this.authService.logout(user);

    // Clear cookies
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return {
      message: 'Logout successful',
    };
  }

  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('application/json')
  @Post('/refresh')
  public async refreshToken(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as UserEntity;
    const tokens = await this.authService.refreshToken(user);

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return tokens;
  }
}
