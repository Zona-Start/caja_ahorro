import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export interface PermissionParam {
  resource: string;
  action: string;
  scope?: string;
}

type PermissionString = string;
export type PermissionInput = PermissionString | PermissionParam;

export const Permissions = (...permissions: PermissionInput[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const parsePermission = (perm: PermissionInput): string => {
  if (typeof perm === 'string') {
    return perm;
  }
  return `${perm.resource}:${perm.action}:${perm.scope || 'own'}`;
};

export const parsePermissions = (permissions: PermissionInput[]): string[] => {
  return permissions.map(parsePermission);
};
