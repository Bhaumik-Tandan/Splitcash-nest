import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import TransactionSchema from './transaction.schema';
// Assuming there's a service or function to handle balance updates
import { BalanceService } from 'src/balance/balance.service'; // Import BalanceService or similar functionality

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(TransactionSchema.name)
    private transactionModel: Model<typeof TransactionSchema>,
    private balanceService: BalanceService, // Inject BalanceService or similar functionality
  ) {}

  async createTransaction(createTransactionDto) {
    const newTransaction = new this.transactionModel(createTransactionDto);
    await newTransaction.save();
    await this.balanceService.updateBalancesAfterTransaction(
      createTransactionDto,
    );

    return newTransaction;
  }
  

  async deleteTransaction(transactionId: string) {
    // Find the transaction by its ID
    const transaction = await this.transactionModel.findById(transactionId).exec();
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }
  
    // Delete the transaction
    await this.transactionModel.findByIdAndDelete(transactionId).exec();
  
    // Update balances after the transaction is deleted
    // Assuming a method like this exists in your BalanceService
    await this.balanceService.updateBalancesAfterTransactionDeletion(transaction);
  
    // Return some confirmation message or the deleted transaction
    return transaction;
  }
  

  getTransactionsByGroupId(groupId) {
    return this.transactionModel
      .find({ group: groupId })
      .populate('paidBy', 'name')
      .populate('creator', 'name')
      .populate({
        path: 'splitAmong.user',
        select: 'name',
      })
      .sort({ date: -1 }) // Sort by date in descending order
      .exec();
  }
}
