import aj, {
  detectBot,
  sensitiveInfo,
  shield,
  slidingWindow,
} from '@/lib/arcjet';
import { base } from '../base';
import { KindeUser } from '@kinde-oss/kinde-auth-nextjs/types';
import { ArcjetNextRequest } from '@arcjet/next';

const buildAiAj = () =>
  aj
    .withRule(shield({ mode: 'LIVE' }))
    .withRule(slidingWindow({ mode: 'LIVE', interval: '1m', max: 3 }))
    .withRule(
      detectBot({
        mode: 'LIVE',
        allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'],
      }),
    )
    .withRule(
      sensitiveInfo({
        mode: 'LIVE',
        deny: ['PHONE_NUMBER', 'CREDIT_CARD_NUMBER'],
      }),
    );

export const aiSecurityMiddleware = base
  .$context<{
    request: Request | ArcjetNextRequest;
    user: KindeUser<Record<string, unknown>>;
  }>()
  .middleware(async ({ context, next, errors }) => {
    const decision = await buildAiAj().protect(context.request, {
      userId: context.user.id,
    });

    if (decision.isDenied()) {
      if (decision.reason.isSensitiveInfo()) {
        throw errors.BAD_REQUEST({
          message:
            'Sensitive information detected. Please remove it and try again.',
        });
      }

      if (decision.reason.isRateLimit()) {
        throw errors.RATE_LIMITED({
          message: 'Too many requests. Please slow down.',
        });
      }

      if (decision.reason.isBot()) {
        throw errors.FORBIDDEN({
          message: 'Bot detected. Automated requests are not allowed.',
        });
      }
      if (decision.reason.isShield()) {
        throw errors.FORBIDDEN({
          message: 'Request blocked by security policy (WAF)!',
        });
      }

      throw errors.FORBIDDEN({
        message: 'Request blocked!',
      });
    }

    return next();
  });
