import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/database/entities';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /api/notifications
   */
  @Get()
  async list(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const result = await this.notificationsService.listForUser(user.id, {
      page,
      limit,
      unreadOnly: unreadOnly === 'true',
    });

    return { success: true, data: result };
  }

  /**
   * PATCH /api/notifications/:id/read
   */
  @Patch(':id/read')
  async markRead(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    const notification = await this.notificationsService.markRead(user.id, id);
    return { success: true, data: notification };
  }

  /**
   * PATCH /api/notifications/read-all
   */
  @Patch('read-all')
  async markAll(@CurrentUser() user: User) {
    await this.notificationsService.markAllRead(user.id);
    return { success: true, message: 'Notifications marquées comme lues' };
  }

  /**
   * DELETE /api/notifications/:id
   */
  @Delete(':id')
  async remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    await this.notificationsService.remove(user.id, id);
    return { success: true, message: 'Notification supprimée' };
  }
}
