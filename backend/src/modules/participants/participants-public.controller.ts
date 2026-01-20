import { Controller, Get, Query } from '@nestjs/common';
import { ParticipantsService } from './participants.service';

@Controller('public/participants')
export class ParticipantsPublicController {
  constructor(private readonly participantsService: ParticipantsService) {}

  /**
   * PUBLIC
   * GET /api/public/participants/lookup?cni=...&email=...
   */
  @Get('lookup')
  async lookup(@Query('cni') cni?: string, @Query('email') email?: string) {
    const participant = await this.participantsService.lookupPublic({ cni, email });

    return {
      success: true,
      data: participant,
    };
  }
}
