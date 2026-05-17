import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { SuggestionsService } from './suggestions.service';

@Controller('customers')
export class SuggestionsController {
  constructor(private readonly suggestions: SuggestionsService) {}

  @Get(':id/suggestions')
  forCustomer(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.suggestions.forCustomer(u.tenantId, id);
  }
}
