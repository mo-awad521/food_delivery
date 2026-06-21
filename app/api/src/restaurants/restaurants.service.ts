import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, or } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CloudinaryService } from '../media/services/cloudinary.service';

@Injectable()
export class RestaurantsService {
  constructor(
    @Inject('DB') private db: NeonHttpDatabase<typeof schema>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    ownerId: string,
    dto: CreateRestaurantDto,
    file?: Express.Multer.File,
  ) {
    const [existing] = await this.db
      .select()
      .from(schema.restaurants)
      .where(eq(schema.restaurants.ownerId, ownerId));

    if (existing) {
      throw new ForbiddenException('You already have a restaurant');
    }

    let imageUrl: string | undefined;
    let imagePublicId: string | undefined;

    if (file) {
      const uploaded = await this.cloudinaryService.uploadImage(
        file,
        'restaurants',
      );
      imageUrl = uploaded.url;
      imagePublicId = uploaded.publicId;
    }

    try {
      const [restaurant] = await this.db
        .insert(schema.restaurants)
        .values({
          ownerId,
          name: dto.name,
          description: dto.description,
          address: dto.address,
          cuisineType: dto.cuisineType,
          imageUrl: imageUrl,
          imagePublicId: imagePublicId,
        })
        .returning();

      return restaurant;
    } catch {
      if (imagePublicId) {
        await this.cloudinaryService.deleteImage(imagePublicId).catch(() => {});
      }
    }
  }

  async findMine(ownerId: string) {
    const [restaurant] = await this.db
      .select()
      .from(schema.restaurants)
      .where(eq(schema.restaurants.ownerId, ownerId));

    return restaurant ?? null;
  }

  async findById(id: string) {
    const [restaurant] = await this.db
      .select()
      .from(schema.restaurants)
      .where(eq(schema.restaurants.id, id));

    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant;
  }

  async findAll(search?: string) {
    // if search is provided, filter by name OR cuisine type (case-insensitive)
    // only return open restaurants to customers
    if (search) {
      return this.db
        .select()
        .from(schema.restaurants)
        .where(
          and(
            eq(schema.restaurants.isOpen, true),
            or(
              ilike(schema.restaurants.name, `%${search}%`),
              ilike(schema.restaurants.cuisineType, `%${search}%`),
            ),
          ),
        );
    }

    return this.db
      .select()
      .from(schema.restaurants)
      .where(eq(schema.restaurants.isOpen, true));
  }

  async update(
    id: string,
    ownerId: string,
    dto: UpdateRestaurantDto,
    file?: Express.Multer.File,
  ) {
    const [restaurant] = await this.db
      .select()
      .from(schema.restaurants)
      .where(eq(schema.restaurants.id, id));

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this restaurant');
    }

    let oldPublicId: string | null = null;
    let newImageUrl = restaurant.imageUrl;
    let newImagePublicId = restaurant.imagePublicId;

    if (file) {
      const uploaded = await this.cloudinaryService.uploadImage(
        file,
        'restaurants',
      );

      oldPublicId = restaurant.imagePublicId;
      newImageUrl = uploaded.url;
      newImagePublicId = uploaded.publicId;
    }

    try {
      const [updated] = await this.db
        .update(schema.restaurants)
        .set({
          ...dto,
          imageUrl: newImageUrl,
          imagePublicId: newImagePublicId,
          updatedAt: new Date(),
        })
        .where(eq(schema.restaurants.id, id))
        .returning();

      if (oldPublicId) {
        await this.cloudinaryService.deleteImage(oldPublicId).catch(() => {});
      }

      return updated;
    } catch (error) {
      // rollback
      if (file && newImagePublicId) {
        await this.cloudinaryService
          .deleteImage(newImagePublicId)
          .catch(() => {});
      }

      throw error;
    }
  }
}
