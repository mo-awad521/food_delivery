import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '@food-delivery/types';
import { UserRole } from '@food-delivery/types';
import { Request as ExpressRequest } from 'express';
import { multerOptions } from '../media/cloudinary.multer';

type AuthRequest = ExpressRequest & { user: JwtPayload };

@Controller('restaurants')
@UseGuards(JwtAuthGuard)
export class RestaurantsController {
  constructor(private restaurantsService: RestaurantsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  create(
    @Request() req: AuthRequest,
    @Body() dto: CreateRestaurantDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.restaurantsService.create(req.user.sub, dto, file);
  }

  @Get('mine')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER)
  findMine(@Request() req: AuthRequest) {
    return this.restaurantsService.findMine(req.user.sub);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    // @Query('search') extracts ?search= from the URL — optional
    return this.restaurantsService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  update(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateRestaurantDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.restaurantsService.update(id, req.user.sub, dto, file);
  }
}
