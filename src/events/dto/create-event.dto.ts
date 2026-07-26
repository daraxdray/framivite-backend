import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  framePosition?: string; // JSON string or raw string { x, y, width, height, rotation }

  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @IsString()
  @IsOptional()
  frameUrl?: string;

  @IsString()
  @IsOptional()
  organizerId?: string;
}
