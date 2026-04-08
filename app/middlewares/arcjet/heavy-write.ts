import arcjet, { sensitiveInfo, slidingWindow } from '@/lib/arcjet';

import { base } from '@/app/middlewares/base';
import { KindeUser } from '@kinde-oss/kinde-auth-nextjs';
import { ArcjetNextRequest } from '@arcjet/next';

const buildStandartAj = () =>
  arcjet
    .withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: 2,
      }),
    )
    .withRule(
      sensitiveInfo({
        mode: 'LIVE',
        deny: ['PHONE_NUMBER', 'CREDIT_CARD_NUMBER'],
      }),
    );
export const heavyWriteSecurityMiddleware = base
  .$context<{
    request: Request | ArcjetNextRequest;
    user: KindeUser<Record<string, unknown>>;
  }>()
  .middleware(async ({ context, next, errors }) => {
    const decision = await buildStandartAj().protect(context.request, {
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
          message: 'Too many impactful changes. Please slow down.',
        });
      }

      throw errors.FORBIDDEN({
        message: 'Request blocked!',
      });
    }

    return next();
  });
