const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/response');

class TransactionController {
  constructor(transactionService) {
    this.transactionService = transactionService;
  }

  deposit = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const accountId = Number(req.params.accountId);

    const result = await this.transactionService.deposit(accountId, amount);

    return sendResponse(res, 200, 'Deposit successful', result);
  });

  withdraw = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const accountId = Number(req.params.accountId);

    const result = await this.transactionService.withdraw(accountId, amount);

    return sendResponse(res, 200, 'Withdrawal successful', result);
  });

  transfer = asyncHandler(async (req, res) => {
    const { fromAccountId, toAccountId, amount } = req.body;

    const result = await this.transactionService.transfer(
      fromAccountId,
      toAccountId,
      amount
    );

    return sendResponse(res, 200, 'Transfer successful', result);
  });

  getAccountTransactions = asyncHandler(async (req, res) => {
    const accountId = Number(req.params.accountId);

    const result = await this.transactionService.getAccountTransactions(accountId);

    return sendResponse(res, 200, 'Transaction history fetched successfully', result);
  });
}

module.exports = TransactionController;