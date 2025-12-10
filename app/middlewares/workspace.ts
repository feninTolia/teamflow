import { base } from '@/app/middlewares/base';
import { KindeOrganization } from '@kinde-oss/kinde-auth-nextjs';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const getWorkspace = async () => {
  const { getOrganization } = getKindeServerSession();
  const organization = await getOrganization();
  return organization;
};

export const requiredWorkspaceMiddleware = base
  .$context<{
    workspace?: KindeOrganization<unknown | null>;
  }>()
  .middleware(async ({ context, next, errors }) => {
    const workspace = context.workspace ?? (await getWorkspace());

    if (!workspace) {
      throw errors.FORBIDDEN();
    }

    return next({ context: { workspace } });
  });
