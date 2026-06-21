import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';
import { CloudinaryService } from '../media/services/cloudinary.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuService {
  constructor(
    @Inject('DB') private db: NeonHttpDatabase<typeof schema>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private async getRestaurantByOwner(ownerId: string) {
    const [restaurant] = await this.db
      .select()
      .from(schema.restaurants)
      .where(eq(schema.restaurants.ownerId, ownerId));

    if (!restaurant) throw new NotFoundException('Create a restaurant first');

    return restaurant;
  }

  // CATEGORIES

  async createCategory(ownerId: string, dto: CreateCategoryDto) {
    const restaurant = await this.getRestaurantByOwner(ownerId);

    if (!restaurant) throw new NotFoundException('Create a restaurant first');

    const [category] = await this.db
      .insert(schema.menuCategories)
      .values({ restaurantId: restaurant.id, name: dto.name })
      .returning();

    return category;
  }

  async getCategories(restaurantId: string) {
    return this.db
      .select()
      .from(schema.menuCategories)
      .where(eq(schema.menuCategories.restaurantId, restaurantId));
  }

  async updateCategory(id: string, ownerId: string, dto: UpdateCategoryDto) {
    const restaurant = await this.getRestaurantByOwner(ownerId);

    const [category] = await this.db
      .select()
      .from(schema.menuCategories)
      .where(eq(schema.menuCategories.id, id));

    if (!category) throw new NotFoundException('Category not found');

    if (category.restaurantId !== restaurant.id) {
      throw new ForbiddenException(
        'This category does not belong to your restaurant',
      );
    }

    const [updated] = await this.db
      .update(schema.menuCategories)
      .set({ name: dto.name })
      .where(eq(schema.menuCategories.id, id))
      .returning();

    return updated;
  }

  async deleteCategory(id: string, ownerId: string) {
    const restaurant = await this.getRestaurantByOwner(ownerId);

    const [category] = await this.db
      .select()
      .from(schema.menuCategories)
      .where(eq(schema.menuCategories.id, id));

    if (!category) throw new NotFoundException('Category not found');

    if (category.restaurantId !== restaurant.id) {
      throw new ForbiddenException(
        'This category does not belong to your restaurant',
      );
    }

    // cascade delete will remove all items in this category automatically
    await this.db
      .delete(schema.menuCategories)
      .where(eq(schema.menuCategories.id, id));

    return { message: 'Category deleted' };
  }

  // MENU ITEMS

  async createItem(
    ownerId: string,
    dto: CreateMenuItemDto,
    file?: Express.Multer.File,
  ) {
    const restaurant = await this.getRestaurantByOwner(ownerId);

    if (!restaurant) throw new NotFoundException('Create a restaurant first');

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
      const [item] = await this.db
        .insert(schema.menuItems)
        .values({
          restaurantId: restaurant.id,
          categoryId: dto.categoryId,
          name: dto.name,
          description: dto.description,
          price: dto.price,
          imageUrl: imageUrl,
          imagePublicId: imagePublicId,
        })
        .returning();

      return item;
    } catch (error) {
      if (imagePublicId) {
        await this.cloudinaryService.deleteImage(imagePublicId).catch(() => {});
      }

      console.error('Drizzle Insertion Error:', error);

      throw error;
    }
  }

  async getItemsByRestaurant(restaurantId: string) {
    return this.db
      .select()
      .from(schema.menuItems)
      .where(eq(schema.menuItems.restaurantId, restaurantId));
  }

  async updateItem(
    id: string,
    ownerId: string,
    dto: UpdateMenuItemDto,
    file?: Express.Multer.File,
  ) {
    const restaurant = await this.getRestaurantByOwner(ownerId);

    const [item] = await this.db
      .select()
      .from(schema.menuItems)
      .where(eq(schema.menuItems.id, id));

    if (!item) throw new NotFoundException('Menu item not found');

    if (item.restaurantId !== restaurant.id) {
      throw new ForbiddenException(
        'This item does not belong to your restaurant',
      );
    }

    let oldPublicId: string | null = null;

    let newImageUrl = item.imageUrl;
    let newImagePublicId = item.imagePublicId;

    if (file) {
      const uploaded = await this.cloudinaryService.uploadImage(
        file,
        'restaurants',
      );

      oldPublicId = item.imagePublicId;

      newImageUrl = uploaded.url;
      newImagePublicId = uploaded.publicId;
    }

    try {
      const [updated] = await this.db
        .update(schema.menuItems)
        .set({
          ...dto,
          imageUrl: newImageUrl,
          imagePublicId: newImagePublicId,
          updatedAt: new Date(),
        })
        .where(eq(schema.menuItems.id, id))
        .returning();

      if (oldPublicId) {
        await this.cloudinaryService.deleteImage(oldPublicId).catch(() => {});
      }
      return updated;
    } catch (error) {
      if (file && newImagePublicId) {
        await this.cloudinaryService
          .deleteImage(newImagePublicId)
          .catch(() => {});
      }

      throw error;
    }
  }

  async deleteItem(id: string, ownerId: string) {
    const restaurant = await this.getRestaurantByOwner(ownerId);

    const [item] = await this.db
      .select()
      .from(schema.menuItems)
      .where(eq(schema.menuItems.id, id));

    if (!item) throw new NotFoundException('Menu item not found');

    if (item.restaurantId !== restaurant.id) {
      throw new ForbiddenException(
        'This item does not belong to your restaurant',
      );
    }

    await this.db.delete(schema.menuItems).where(eq(schema.menuItems.id, id));

    return { message: 'Item deleted' };
  }
}
