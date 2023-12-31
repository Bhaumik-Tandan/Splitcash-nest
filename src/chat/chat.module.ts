import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import ChatSchema from './chat.schema';
@Module({
  imports: [MongooseModule.forFeature([ChatSchema])],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
