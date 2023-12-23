import { Injectable } from '@nestjs/common';
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
    await this.updateBalances(createTransactionDto);

    return newTransaction;
  }

  private async updateBalances(transactionDto) {
    await this.balanceService.updateBalancesAfterTransaction(transactionDto);
  }

  getTransactionsByGroupId(groupId){
    return this.transactionModel.find({ group: groupId });
}

}