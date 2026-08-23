import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { OAuthProfileType } from 'src/types/Auth.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(readonly configService: ConfigService) {
    super({
      // Defaulted (not getOrThrow) so the app still boots when OAuth
      // credentials aren't configured yet -- only /auth/google itself
      // fails until GOOGLE_CLIENT_ID/SECRET are set in .env.
      clientID:
        configService.get<string>('GOOGLE_CLIENT_ID') || 'not-configured',
      clientSecret:
        configService.get<string>('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ||
        'https://localhost/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('Google account has no email'), false);

    const oauthProfile: OAuthProfileType = {
      provider: 'google',
      providerId: profile.id,
      email,
      username: profile.displayName || email.split('@')[0],
    };
    done(null, oauthProfile);
  }
}
