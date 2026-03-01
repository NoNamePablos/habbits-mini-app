import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  UsersService,
  TelegramUserData,
} from '../../modules/users/users.service';

interface RequestWithUser {
  headers: Record<string, string | undefined>;
  user?: unknown;
  isNewUser?: boolean;
}

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  private readonly logger = new Logger(TelegramAuthGuard.name);
  private readonly botToken: string;
  private readonly maxAgeSeconds = 86400; // 24 hours

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.botToken = this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const initData = request.headers['x-telegram-init-data'];

    if (!initData) {
      this.logger.warn('Missing x-telegram-init-data header');
      throw new UnauthorizedException('Missing Telegram init data');
    }

    const tgUser = this.validateInitData(initData);
    const { user, isNewUser } =
      await this.usersService.findOrCreateFromTelegram(tgUser);
    request.user = user;
    request.isNewUser = isNewUser;
    return true;
  }

  private validateInitData(initData: string): TelegramUserData {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      throw new UnauthorizedException('Missing hash in init data');
    }

    // Check auth_date expiration
    const authDate = Number(params.get('auth_date'));
    if (!authDate) {
      throw new UnauthorizedException('Missing auth_date');
    }

    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > this.maxAgeSeconds) {
      throw new UnauthorizedException('Init data expired');
    }

    // Build data-check-string
    params.delete('hash');
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // HMAC-SHA256 validation
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(this.botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    const calculatedHashBuf = Buffer.from(calculatedHash, 'hex');
    const suppliedHashBuf = Buffer.from(hash, 'hex');

    if (
      calculatedHashBuf.length !== suppliedHashBuf.length ||
      !crypto.timingSafeEqual(calculatedHashBuf, suppliedHashBuf)
    ) {
      throw new UnauthorizedException('Invalid init data signature');
    }

    // Parse and validate user
    const userRaw = params.get('user');
    if (!userRaw) {
      throw new UnauthorizedException('Missing user in init data');
    }

    const parsed: unknown = JSON.parse(userRaw);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).id !== 'number'
    ) {
      throw new UnauthorizedException('Invalid user payload');
    }

    return parsed as TelegramUserData;
  }
}
