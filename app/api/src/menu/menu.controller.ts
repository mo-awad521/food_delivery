import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { MenuService } from './menu.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload, UserRole } from '@food-delivery/types';
import { multerOptions } from '../media/cloudinary.multer';
import { FileInterceptor } from '@nestjs/platform-express';

type AuthRequest = ExpressRequest & { user: JwtPayload };

@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  // CATEGORIES

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER)
  createCategory(@Request() req: AuthRequest, @Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(req.user.sub, dto);
  }

  @Get('categories/:restaurantId')
  getCategories(@Param('restaurantId') restaurantId: string) {
    return this.menuService.getCategories(restaurantId);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER)
  updateCategory(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.menuService.updateCategory(id, req.user.sub, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER)
  deleteCategory(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.menuService.deleteCategory(id, req.user.sub);
  }

  // MENU ITEMS

  @Post('items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  createItem(
    @Request() req: AuthRequest,
    @Body() dto: CreateMenuItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.menuService.createItem(req.user.sub, dto, file);
  }

  @Get('items/:restaurantId')
  getItems(@Param('restaurantId') restaurantId: string) {
    return this.menuService.getItemsByRestaurant(restaurantId);
  }

  @Patch('items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  updateItem(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateMenuItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.menuService.updateItem(id, req.user.sub, dto, file);
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER)
  deleteItem(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.menuService.deleteItem(id, req.user.sub);
  }
}
