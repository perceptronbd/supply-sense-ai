import { AuthenticatedUser, CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { Controller, Get, HttpStatus, Inject, Logger, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';

@ApiTags('connections')
@Controller('connections')
export class ConnectionsController {
  private readonly logger = new Logger(ConnectionsController.name);

  constructor(@Inject(ConnectionsService) private readonly connectionsService: ConnectionsService) {
    this.logger.log('ConnectionsController constructor - explicit injection');
  }

  @Get(':companyId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  // Temporarily disabled to unblock connections API without chat permission
  // @RequirePermissions(CHAT_PERMISSIONS.READ_MESSAGES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get database connections for a company' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Database connections retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          host: { type: 'string' },
          port: { type: 'number' },
          database: { type: 'string' },
          username: { type: 'string' },
          sslEnabled: { type: 'boolean' },
        },
      },
    },
  })
  async getCompanyConnections(
    @Param('companyId') companyId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    // Ensure user can only access their own company's connections
    if (user.companyId !== companyId) {
      throw new Error('Access denied: Cannot access other company connections');
    }

    // Get connections without sensitive information
    const connections = await this.connectionsService.getDbConnections(companyId);
    // Return connections without password for security
    return connections.map((conn) => ({
      id: conn.id,
      title: conn.title,
      host: conn.host,
      port: conn.port,
      database: conn.database,
      username: conn.username,
      sslEnabled: conn.sslEnabled,
    }));
  }
}
