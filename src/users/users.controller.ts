import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
@UseGuards(new JwtAuthGuard('jwt'))
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUser(@Req() req: Request) {
    const { id } = req['user'];
    return this.usersService.findById(id);
  }

  @Patch('/name')
  async editName(@Req() req: Request, @Body() { name }) {
    const { id } = req['user'];
    return this.usersService.editName(id, name);
  }
}
