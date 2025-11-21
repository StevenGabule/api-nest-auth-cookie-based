import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleOauthStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      // Put config in `.env`
      clientID: configService.get<string>('google.oauth_google_id')!,
      clientSecret: configService.get<string>('google.oauth_google_secret')!,
      callbackURL: configService.get<string>('google.oauth_google_callback')!,
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const { id, name, emails } = profile;
    return {
      provider: 'google',
      providerId: id,
      uid: id,
      name: name!.givenName,
      username: emails![0].value,
      email: emails![0].value,
    };
  }
}
