import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { UserSigInDto } from './dto/auth-request.dto';
import { UserEntity } from '../user/entity/user.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserSignupDto } from '../user/dto/user-request.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly usersService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private async comparePassword(currentPassword: string, userPassword: string) {
    return await bcrypt.compare(currentPassword, userPassword);
  }

  private async createJwtToken(user: UserEntity) {
    const data: JwtPayload = {
      userId: user.id,
      email: user.email,
      permission: user.permissions,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(data, {
        secret: this.configService.get('access_token_secret'),
        expiresIn: '1d',
      }),
      this.jwtService.signAsync(data, {
        secret: this.configService.get('refresh_token_secret'),
        expiresIn: '7d',
      }),
    ]);

    return {
      ...data,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private async updateRefreshToken(email: string, refToken: string) {
    await this.usersService.updateRefreshTokenByEmail(email, refToken);
  }

  async validateUserByPassword(payload: UserSigInDto) {
    const { email, password } = payload;
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException(`It seems user didn't exist in our system.`);
    }

    let isMatch = false;

    isMatch = await this.comparePassword(password, user.password);

    if (isMatch) {
      const data = await this.createJwtToken(user);
      console.log({ data });
      await this.updateRefreshToken(user.email, data.refresh_token);
      return data;
    } else {
      throw new NotFoundException(`user with email password not found`);
    }
  }

  public async validateJwtPayload(payload: JwtPayload) {
    const data = await this.usersService.findOneByEmail(
      payload.email as string,
    );
    if (data && data.password) {
      data.password = '';
    }
    return data;
  }

  public async logout(user: UserEntity) {
    const { email } = user;
    await this.usersService.updateRefreshTokenByEmail(email, null);
  }

  public async refreshToken(user: UserEntity) {
    const { refresh_token, email } = user;
    const userData =
      await this.usersService.findOneByEmailWithRefreshToken(email);
    if (!userData) {
      throw new ForbiddenException();
    }

    if (!userData.refresh_token) {
      throw new ForbiddenException('Invalid token');
    }

    const isMatchFound = await bcrypt.compare(
      refresh_token,
      userData.refresh_token,
    );

    if (!isMatchFound) {
      throw new ForbiddenException('Invalid refresh token');
    }

    const tokens = await this.createJwtToken(userData);

    await this.updateRefreshToken(email, tokens.refresh_token);

    return tokens;
  }

  public async createGoogleToken(user: { email: string; username: string }) {
    let savedUser = await this.usersService.findOneByEmail(user.email);

    if (!savedUser) {
      savedUser = await this.usersService.create({
        email: user.username,
        password: uuidv4(),
      } as UserSignupDto);
    }

    const data: JwtPayload = {
      userId: savedUser.id,
      email: savedUser.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(data, {
        secret: this.configService.get<string>('access_token'),
        expiresIn: '1d',
      }),
      this.jwtService.signAsync(data, {
        secret: this.configService.get<string>('refresh_token_secret'),
        expiresIn: '1d',
      }),
    ]);
    console.log({
      ...data,
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return {
      ...data,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
