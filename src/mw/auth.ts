import { OAuth2Client } from 'google-auth-library';

// --- Koa stub, only until I migrate to the framework
declare namespace Koa {
  interface Context {
    request: {
      headers: {
        authorization: string;
      };
    };
    status: number;
    body: string;
    set: (key: string, value: string) => void;
  }

  export type Next = () => Promise<void>;
}
// ---

const restrictedEmails = process.env['RESTRICTED_EMAILS']?.split(',') ?? [];

export default async (ctx: Koa.Context, next: Koa.Next) => {
  const token = ctx.request.headers.authorization;
  const auth = new OAuth2Client({
    clientId: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  });

  try {
    const ticket = await auth.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const attributes = ticket.getAttributes();
    const userEmail =
      attributes?.payload?.email_verified && attributes?.payload?.email;

    if (!userEmail || !restrictedEmails.includes(userEmail)) {
      ctx.status = 401;
      ctx.body = 'Unauthorized';
      return;
    }

    ctx.set('token-ticket', JSON.stringify(attributes));
    // @ts-expect-error - a quick and dirty hack to pass the token payload
    ctx.tokenPayload = attributes?.payload;
    await next();
  } catch (e) {
    console.log('Failed to verify token', e);
    ctx.set(
      'middleware',
      JSON.stringify({ msg: 'Failed to verify token', error: e }),
    );
    ctx.status = 401;
    ctx.body = 'Unauthorized';
    return;
  }
};
