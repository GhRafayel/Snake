import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, Profile } from 'passport-github2';
import { OAuthProfileType } from 'src/types/Auth.interface';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(readonly configService: ConfigService) {
    super({
      clientID:
        configService.get<string>('GITHUB_CLIENT_ID') || 'not-configured',
      clientSecret:
        configService.get<string>('GITHUB_CLIENT_SECRET') || 'not-configured',
      callbackURL:
        configService.get<string>('GITHUB_CALLBACK_URL') ||
        'https://localhost/api/auth/github/callback',
      scope: ['user:email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: OAuthProfileType | false) => void,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email)
      return done(
        new Error('GitHub account has no public/verified email'),
        false,
      );

    const oauthProfile: OAuthProfileType = {
      provider: 'github',
      providerId: profile.id,
      email,
      username: profile.username || profile.displayName || email.split('@')[0],
    };
    done(null, oauthProfile);
  }
}
