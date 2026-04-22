const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

class TransactionService {
  constructor(db, accountRepository, transactionRepository) {
    this.db = db;
    this.accountRepository = accountRepository;
    this.transactionRepository = transactionRepository;
  }

  generateReference(prefix) {
    return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  async deposit(accountId, amount) {
    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const account = await this.accountRepository.findByIdForUpdate(connection, accountId);

      if (!account) {
        throw new ApiError(404, 'Account not found');
      }

      if (account.status !== 'ACTIVE') {
        throw new ApiError(400, 'Account is not active');
      }

      const previousBalance = Number(account.balance);
      const currentBalance = previousBalance + Number(amount);

      await this.accountRepository.updateBalance(connection, accountId, currentBalance);

      await this.transactionRepository.createTransaction(connection, {
        referenceId: this.generateReference('DEP'),
        type: 'DEPOSIT',
        fromAccountId: null,
        toAccountId: accountId,
        amount,
        status: 'SUCCESS',
        description: 'Deposit successful',
      });

      const updatedAccount = await this.accountRepository.findById(connection, accountId);

      await connection.commit();

      return {
        account: updatedAccount,
        previousBalance,
        currentBalance,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async withdraw(accountId, amount) {
    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const account = await this.accountRepository.findByIdForUpdate(connection, accountId);

      if (!account) {
        throw new ApiError(404, 'Account not found');
      }

      if (account.status !== 'ACTIVE') {
        throw new ApiError(400, 'Account is not active');
      }

      const previousBalance = Number(account.balance);

      if (previousBalance < Number(amount)) {
        throw new ApiError(400, 'Insufficient balance');
      }

      const currentBalance = previousBalance - Number(amount);

      await this.accountRepository.updateBalance(connection, accountId, currentBalance);

      await this.transactionRepository.createTransaction(connection, {
        referenceId: this.generateReference('WDR'),
        type: 'WITHDRAWAL',
        fromAccountId: accountId,
        toAccountId: null,
        amount,
        status: 'SUCCESS',
        description: 'Withdrawal successful',
      });

      const updatedAccount = await this.accountRepository.findById(connection, accountId);

      await connection.commit();

      return {
        account: updatedAccount,
        previousBalance,
        currentBalance,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async transfer(fromAccountId, toAccountId, amount) {
    if (Number(fromAccountId) === Number(toAccountId)) {
      throw new ApiError(400, 'Transfer to same account is not allowed');
    }

    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const firstLockId =
        Number(fromAccountId) < Number(toAccountId) ? Number(fromAccountId) : Number(toAccountId);

      const secondLockId =
        Number(fromAccountId) < Number(toAccountId) ? Number(toAccountId) : Number(fromAccountId);

      const firstAccount = await this.accountRepository.findByIdForUpdate(connection, firstLockId);
      const secondAccount = await this.accountRepository.findByIdForUpdate(connection, secondLockId);

      if (!firstAccount || !secondAccount) {
        throw new ApiError(404, 'One or both accounts not found');
      }

      const fromAccount =
        Number(firstAccount.id) === Number(fromAccountId) ? firstAccount : secondAccount;

      const toAccount =
        Number(firstAccount.id) === Number(toAccountId) ? firstAccount : secondAccount;

      if (fromAccount.status !== 'ACTIVE' || toAccount.status !== 'ACTIVE') {
        throw new ApiError(400, 'Both accounts must be active');
      }

      const senderPreviousBalance = Number(fromAccount.balance);
      const receiverPreviousBalance = Number(toAccount.balance);

      if (senderPreviousBalance < Number(amount)) {
        throw new ApiError(400, 'Insufficient balance');
      }

      const senderCurrentBalance = senderPreviousBalance - Number(amount);
      const receiverCurrentBalance = receiverPreviousBalance + Number(amount);

      await this.accountRepository.updateBalance(
        connection,
        fromAccount.id,
        senderCurrentBalance
      );

      await this.accountRepository.updateBalance(
        connection,
        toAccount.id,
        receiverCurrentBalance
      );

      await this.transactionRepository.createTransaction(connection, {
        referenceId: this.generateReference('TRF'),
        type: 'TRANSFER',
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount,
        status: 'SUCCESS',
        description: 'Transfer successful',
      });

      const updatedFromAccount = await this.accountRepository.findById(connection, fromAccount.id);
      const updatedToAccount = await this.accountRepository.findById(connection, toAccount.id);

      await connection.commit();

      return {
        fromAccount: updatedFromAccount,
        toAccount: updatedToAccount,
        transferredAmount: Number(amount),
        senderPreviousBalance,
        senderCurrentBalance,
        receiverPreviousBalance,
        receiverCurrentBalance,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  async getAccountTransactions(accountId) {
  const connection = await this.db.getConnection();

  try {
    const account = await this.accountRepository.findById(connection, accountId);

    if (!account) {
      throw new ApiError(404, 'Account not found');
    }

    const transactions = await this.transactionRepository.getTransactionsByAccountId(
      connection,
      accountId
    );

    return {
      account: {
        id: account.id,
        account_number: account.account_number,
        account_holder_name: account.account_holder_name,
        balance: account.balance,
        status: account.status,
      },
      transactions,
    };
  } finally {
    connection.release();
  }
 }
 
}

module.exports = TransactionService;