import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryService } from '../media/services/cloudinary.service';

@Module({
  imports: [AuthModule],
  controllers: [MenuController],
  providers: [MenuService, CloudinaryService],
})
export class MenuModule {}
