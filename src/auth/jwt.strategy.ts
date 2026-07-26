import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'framivite-secret-key-2026',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const organizer = await this.prisma.organizer.findUnique({
      where: { id: payload.sub },
    });

    if (!organizer) {
      throw new UnauthorizedException('Organizer account not found');
    }

    return { id: organizer.id, name: organizer.name, email: organizer.email };
  }
}
