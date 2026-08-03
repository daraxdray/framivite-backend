import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [totalEvents, totalUsers, totalRegistrations, recentEvents, recentUsers] = await Promise.all([
      this.prisma.event.count(),
      this.prisma.organizer.count(),
      this.prisma.registration.count(),
      this.prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          organizer: { select: { id: true, name: true, email: true } },
          _count: { select: { registrations: true } },
        },
      }),
      this.prisma.organizer.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { events: true } },
        },
      }),
    ]);

    return {
      totalEvents,
      totalUsers,
      totalRegistrations,
      recentEvents,
      recentUsers,
    };
  }

  async getAllEvents() {
    return this.prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        _count: { select: { registrations: true } },
      },
    });
  }

  async deleteEvent(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.prisma.event.delete({ where: { id } });
    return { success: true, message: 'Event deleted successfully by admin' };
  }

  async getAllUsers() {
    return this.prisma.organizer.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { events: true } },
      },
    });
  }

  async updateUserRole(id: string, role: string) {
    const validRoles = ['ORGANIZER', 'ADMIN'];
    const upperRole = role.toUpperCase();
    if (!validRoles.includes(upperRole)) {
      throw new BadRequestException(`Invalid role. Allowed roles: ${validRoles.join(', ')}`);
    }

    const user = await this.prisma.organizer.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.organizer.update({
      where: { id },
      data: { role: upperRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async deleteUser(id: string) {
    const user = await this.prisma.organizer.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.organizer.delete({ where: { id } });
    return { success: true, message: 'User deleted successfully by admin' };
  }

  async getAllRegistrations() {
    return this.prisma.registration.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });
  }
}
