import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Guard to ensure company isolation - users can only access their own company's data
 */
@Injectable()
export class CompanyIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Add companyId to request for use in services
    request.companyId = user.companyId;

    // Check if companyId is in request parameters or body and validate it matches user's company
    const requestedCompanyId = request.params?.companyId || request.body?.companyId;

    if (requestedCompanyId && requestedCompanyId !== user.companyId) {
      throw new ForbiddenException(
        'Access denied. You can only access data from your own company.'
      );
    }

    return true;
  }
}
