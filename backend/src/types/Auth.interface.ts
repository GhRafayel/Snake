export interface JwtPayloadType {
  userId: number;
  sessionId: string;
}

export interface RequestWithUserType {
  user: PayloadType;
}

export interface RequestWithCookiesType {
  cookies: Record<string, string>;
}

export interface PayloadType {
  userId: number;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface OAuthProfileType {
  provider: string;
  providerId: string;
  email: string;
  username: string;
}

export interface RequestWithOAuthProfileType {
  user: OAuthProfileType;
}
