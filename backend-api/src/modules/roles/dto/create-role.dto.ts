import { IsString, IsOptional, IsArray, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'manager' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [String], description: 'Array of Permission IDs to assign' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  permissions?: string[];
}
