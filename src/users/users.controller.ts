import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
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

  @Put()
  async editName(@Req() req: Request, @Body() newUserBody) {
    const { id } = req['user'];
    return this.usersService.editUser(id, newUserBody);
  }
}
