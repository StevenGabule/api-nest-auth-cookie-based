import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser } from './role-guard';

export const User = createParamDecorator((data: any, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<RequestWithUser>();
  if (req.user) {
    return req.user;
  }
  return null;
});

export interface UserMetaData {
  userId: string;
  email: string;
  permissions: string;
}
