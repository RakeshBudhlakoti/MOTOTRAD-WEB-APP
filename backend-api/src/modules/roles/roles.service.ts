import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Role with this name already exists');
    }

    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        permissions: {
          create: dto.permissions?.map(pId => ({
            permission: { connect: { id: pId } }
          })) || []
        }
      },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
  }

  async findAll(skip: number = 0, take: number = 20, search?: string) {
    const where = search ? {
      name: { contains: search, mode: 'insensitive' as any }
    } : {};

    const [items, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take,
        include: {
          _count: { select: { users: true } },
          permissions: { include: { permission: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.role.count({ where })
    ]);

    return {
      items,
      meta: {
        total,
        page: Math.floor(skip / take) + 1,
        lastPage: Math.ceil(total / take),
      }
    };
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } }
      }
    });

    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new ConflictException('Cannot modify system roles');

    // First delete all existing permissions for this role to avoid conflicts
    if (dto.permissions) {
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: id }
      });
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        ...(dto.permissions && {
          permissions: {
            create: dto.permissions.map(pId => ({
              permission: { connect: { id: pId } }
            }))
          }
        })
      },
      include: {
        permissions: { include: { permission: true } }
      }
    });
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({ 
      where: { id },
      include: { _count: { select: { users: true } } }
    });
    
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new ConflictException('Cannot delete system roles');
    if (role._count.users > 0) throw new ConflictException('Cannot delete role assigned to users');

    return this.prisma.role.delete({ where: { id } });
  }

  async getAllPermissions() {
    // Returns all available permissions grouped by resource for the matrix UI
    const permissions = await this.prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    });

    // Seed some basic permissions if DB is empty
    if (permissions.length === 0) {
      return this.seedPermissions();
    }

    return permissions;
  }

  private async seedPermissions() {
    const defaultPerms = [
      { resource: 'users', action: 'create', description: 'Create users' },
      { resource: 'users', action: 'read', description: 'View users' },
      { resource: 'users', action: 'update', description: 'Update users' },
      { resource: 'users', action: 'delete', description: 'Delete users' },
      { resource: 'products', action: 'create', description: 'Create products' },
      { resource: 'products', action: 'read', description: 'View products' },
      { resource: 'products', action: 'update', description: 'Update products' },
      { resource: 'products', action: 'delete', description: 'Delete products' },
      { resource: 'orders', action: 'read', description: 'View orders' },
      { resource: 'orders', action: 'update', description: 'Update orders' },
      { resource: 'settings', action: 'read', description: 'View settings' },
      { resource: 'settings', action: 'update', description: 'Update settings' },
    ];

    await this.prisma.permission.createMany({
      data: defaultPerms,
      skipDuplicates: true,
    });

    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }]
    });
  }
}
