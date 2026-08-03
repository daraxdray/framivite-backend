import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const existing = await this.prisma.organizer.findUnique({
      where: { email: signupDto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    const organizer = await this.prisma.organizer.create({
      data: {
        name: signupDto.name,
        email: signupDto.email.toLowerCase(),
        password: hashedPassword,
      },
    });

    const token = this.generateToken(organizer.id, organizer.email, organizer.role);

    return {
      token,
      organizer: {
        id: organizer.id,
        name: organizer.name,
        email: organizer.email,
        role: organizer.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const organizer = await this.prisma.organizer.findUnique({
      where: { email: loginDto.email.toLowerCase() },
    });

    if (!organizer) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(loginDto.password, organizer.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(organizer.id, organizer.email, organizer.role);

    return {
      token,
      organizer: {
        id: organizer.id,
        name: organizer.name,
        email: organizer.email,
        role: organizer.role,
      },
    };
  }

  private generateToken(sub: string, email: string, role: string): string {
    return this.jwtService.sign({ sub, email, role });
  }
}
