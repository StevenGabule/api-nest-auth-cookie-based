import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRoles } from '../auth.dto';
import { UserMetaData } from './user';

export interface RequestWithUser extends Request {
  user: UserMetaData;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const roles =
      this.reflector.getAllAndMerge<UserRoles[]>('roles', [
        context.getClass(),
        context.getHandler(),
      ]) || [];

    if (roles && roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (user && !user.permissions) {
      return false;
    }

    const hasRole = () =>
      user.permissions
        ?.split(',')
        .some((role: string) => roles.includes(role as UserRoles));

    return Boolean(user && user.permissions && hasRole());
  }
}
