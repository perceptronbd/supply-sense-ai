import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Guard to check if user has access to specific branches
 */
@Injectable()
export class BranchAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Super admins have access to all branches
    if (user.isSuperAdmin) {
      return true;
    }

    // Check if branchId is in request parameters or body
    const branchId = request.params?.branchId || request.body?.branchId;

    if (!branchId) {
      // If no specific branch is requested, allow access
      return true;
    }

    // Check if user has access to this branch
    const hasAccess = user.branchIds?.includes(branchId);

    if (!hasAccess) {
      throw new ForbiddenException(`Access denied. You don't have access to branch: ${branchId}`);
    }

    return true;
  }
}
