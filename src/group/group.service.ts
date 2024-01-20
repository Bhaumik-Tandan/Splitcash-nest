import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import GroupSchema from './group.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { TransactionService } from 'src/transaction/transaction.service';
import { UsersService } from 'src/users/users.service';
import { ChatService } from 'src/chat/chat.service';
import { ActivityFeedService } from 'src/activity-feed/activity-feed.service';
@Injectable()
export class GroupService {
  constructor(
    @InjectModel(GroupSchema.name)
    private groupModel: Model<{ name: string; members: string[] }>,
    private transactionService: TransactionService,
    private userService: UsersService,
    private chatService: ChatService,
    private activityFeedService: ActivityFeedService,
  ) {}
  async create(createGroupDto) {
    const { members, name, phoneNumbers } = createGroupDto;
    const newMemberIds =
      await this.userService.createUsersAndGetIds(phoneNumbers);

    const allMemberIds = members
      .map((id) => id.toString())
      .concat(newMemberIds.map((id) => id.toString()));
    const uniqueMemberIdStrings = [...new Set(allMemberIds)];
    const uniqueMemberIds = uniqueMemberIdStrings.map(
      (idString: string) => new Types.ObjectId(idString),
    );

    const createdGroup = new this.groupModel({
      members: uniqueMemberIds,
      name,
    });

    return createdGroup.save();
  }

  createChat(message, group, creator) {
    const chat = this.chatService.create(message);
    return this.activityFeedService.createActivity({
      activityType: 'chat',
      creator,
      group,
      relatedId: chat._id,
      onModel: 'Chat',
    });
  }

  async leaveGroup(userId, groupId) {
    // Find the group
    const group = await this.groupModel.findById(groupId).exec();

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if the user is a member of the group
    const isMember = group.members.includes(userId.toString());

    if (!isMember) {
      throw new NotFoundException('User is not a member of the group');
    }

    group.members = group.members.filter((id) => id != userId.toString());

    // Save the updated group
    await group.save();

    return group; // Or some other meaningful response
  }

  async addMembers(groupId, phoneNumbers) {
    // Find the group
    const group = await this.groupModel.findById(groupId).exec();

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Create users based on phone numbers and get their IDs
    const newMemberIds =
      await this.userService.createUsersAndGetIds(phoneNumbers);

    // Filter out existing members from the new users
    const nonExistingMembers = newMemberIds.filter(
      (id) => !group.members.includes(id.toString()),
    );

    // If all users are existing members, you can simply return the group without making any changes
    if (nonExistingMembers.length === 0) {
      return group;
    }

    // Add the new users to the group's members array
    const newMemberObjectIds = nonExistingMembers.map(
      (id) => new Types.ObjectId(id),
    );
    group.members.push(
      ...newMemberObjectIds.map((objectId) => objectId.toString()),
    );

    // Save the updated group
    await group.save();

    return group; // Or some other meaningful response
  }

  async editGroupName(groupId, groupName) {
    return await this.groupModel.updateOne(
      { _id: groupId },
      { $set: { name: groupName } },
    );
  }

  async joinGroup(groupId, userId) {
    const group = await this.groupModel.findById(groupId).exec();

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const { members } = group;
    // Check if the user is already a member of the group
    if (members.includes(userId)) {
      throw new BadRequestException('User already a member of the group');
    }

    // Add the user to the group's members array
    members.push(userId);

    // Save the updated group
    await group.save();

    return group; // Or some other meaningful response
  }

  async getAllUserGroups(userId) {
    try {
      const userGroups = await this.groupModel.aggregate([
        {
          $match: {
            members: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: 'balances', // replace 'balances' with your actual Balance model's collection name
            let: { groupId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$group', '$$groupId'] },
                      {
                        $or: [
                          { lender: new mongoose.Types.ObjectId(userId) },
                          { borrower: new mongoose.Types.ObjectId(userId) },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'userBalances',
          },
        },
        {
          $addFields: {
            balance: { $gt: [{ $size: '$userBalances' }, 0] },
          },
        },
        {
          $unset: 'userBalances',
        },
        {
          $lookup: {
            from: 'users', // replace 'users' with your actual User model's collection name
            localField: 'members',
            foreignField: '_id',
            as: 'members',
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            members: 1,
            balance: 1,
          },
        },
      ]);

      return userGroups;
    } catch (error) {
      console.error('Error getting user groups:', error);
      throw error;
    }
  }

  async getAllTransactions(groupId) {
    return this.transactionService.getTransactionsByGroupId(groupId);
  }
}
