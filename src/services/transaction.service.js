const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

class TransactionService {
  constructor(db, accountRepository, transactionRepository, idempotencyRepository) {
    this.db = db;
    this.accountRepository = accountRepository;
    this.transactionRepository = transactionRepository;
    this.idempotencyRepository = idempotencyRepository;
  }

  generateReference(prefix) {
    return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  generateRequestHash(payload) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
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

  async transfer(fromAccountId, toAccountId, amount, idempotencyKey) {
    if (!idempotencyKey) {
      throw new ApiError(400, 'Idempotency-Key header is required');
    }

    if (Number(fromAccountId) === Number(toAccountId)) {
      throw new ApiError(400, 'Transfer to same account is not allowed');
    }

    const requestPayload = {
      fromAccountId: Number(fromAccountId),
      toAccountId: Number(toAccountId),
      amount: Number(amount),
    };

    const requestHash = this.generateRequestHash(requestPayload);

    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const existingKey = await this.idempotencyRepository.findByKey(
        connection,
        idempotencyKey
      );

      if (existingKey) {
        if (existingKey.request_hash !== requestHash) {
          throw new ApiError(
            409,
            'Idempotency key already used with a different request payload'
          );
        }

        if (existingKey.status === 'COMPLETED') {
          await connection.commit();
          return typeof existingKey.response_body === 'string'
            ? JSON.parse(existingKey.response_body)
            : existingKey.response_body;
        }

        if (existingKey.status === 'PROCESSING') {
          throw new ApiError(409, 'A request with this idempotency key is already processing');
        }

        if (existingKey.status === 'FAILED') {
          throw new ApiError(409, 'Previous request with this idempotency key failed');
        }
      }

      await this.idempotencyRepository.createKey(connection, {
        idempotencyKey,
        requestHash,
      });

      const firstLockId =
        Number(fromAccountId) < Number(toAccountId)
          ? Number(fromAccountId)
          : Number(toAccountId);

      const secondLockId =
        Number(fromAccountId) < Number(toAccountId)
          ? Number(toAccountId)
          : Number(fromAccountId);

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

      const responseBody = {
        fromAccount: updatedFromAccount,
        toAccount: updatedToAccount,
        transferredAmount: Number(amount),
        senderPreviousBalance,
        senderCurrentBalance,
        receiverPreviousBalance,
        receiverCurrentBalance,
      };

      await this.idempotencyRepository.markCompleted(
        connection,
        idempotencyKey,
        responseBody
      );

      await connection.commit();

      return responseBody;
    } catch (error) {
      try {
        await connection.rollback();
      } catch (_) {
        // ignore rollback failure
      }

      try {
        const cleanupConnection = await this.db.getConnection();
        try {
          await this.idempotencyRepository.markFailed(cleanupConnection, idempotencyKey);
        } finally {
          cleanupConnection.release();
        }
      } catch (_) {
        // ignore cleanup failure
      }

      throw error;
    } finally {
      connection.release();
    }
  }

  async getAccountTransactions(accountId, page = 1, limit = 10) {
    const connection = await this.db.getConnection();

    try {
      const account = await this.accountRepository.findById(connection, accountId);

      if (!account) {
        throw new ApiError(404, 'Account not found');
      }

      const safePage = Number(page);
      const safeLimit = Number(limit);

      if (!Number.isInteger(safePage) || safePage < 1) {
        throw new ApiError(400, 'Page must be a positive integer');
      }

      if (!Number.isInteger(safeLimit) || safeLimit < 1 || safeLimit > 100) {
        throw new ApiError(400, 'Limit must be an integer between 1 and 100');
      }

      const offset = (safePage - 1) * safeLimit;

      const totalTransactions = await this.transactionRepository.countTransactionsByAccountId(
        connection,
        accountId
      );

      const transactions = await this.transactionRepository.getTransactionsByAccountId(
        connection,
        accountId,
        safeLimit,
        offset
      );

      const totalPages = Math.ceil(totalTransactions / safeLimit);

      return {
        account: {
          id: account.id,
          account_number: account.account_number,
          account_holder_name: account.account_holder_name,
          balance: account.balance,
          status: account.status,
        },
        pagination: {
          total: totalTransactions,
          page: safePage,
          limit: safeLimit,
          totalPages,
        },
        transactions,
      };
    } finally {
      connection.release();
    }
  }
}

module.exports = TransactionService;