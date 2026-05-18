import { Body, Controller, Get, Post, UseGuards, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  loginSchema,
  refreshSchema,
  LoginInput,
  RefreshInput,
  signupSchema,
  SignupInput,
  acceptInviteSchema,
  AcceptInviteInput,
} from '@teletrade/shared';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  login(@Body() body: LoginInput) {
    return this.auth.login(body.email, body.password);
  }

  @Public()
  @Post('signup')
  @UsePipes(new ZodValidationPipe(signupSchema))
  signup(@Body() body: SignupInput) {
    return this.auth.signup(body);
  }

  @Public()
  @Post('accept-invite')
  @UsePipes(new ZodValidationPipe(acceptInviteSchema))
  acceptInvite(@Body() body: AcceptInviteInput) {
    return this.auth.acceptInvitation(body.token, body.password);
  }

  @Public()
  @Post('refresh')
  @UsePipes(new ZodValidationPipe(refreshSchema))
  refresh(@Body() body: RefreshInput) {
    return this.auth.refresh(body.refreshToken);
  }

  @Public()
  @Post('logout')
  @UsePipes(new ZodValidationPipe(refreshSchema))
  async logout(@Body() body: RefreshInput) {
    await this.auth.logout(body.refreshToken);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.userId);
  }
}
