const ApiError = require('../utils/ApiError');

class AccountService {
  constructor(db, accountRepository) {
    this.db = db;
    this.accountRepository = accountRepository;
  }

  generateAccountNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `AC${timestamp.slice(-8)}${random}`;
  }

  async createAccount({ accountHolderName, openingBalance }) {
    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const accountNumber = this.generateAccountNumber();

      const accountId = await this.accountRepository.createAccount(connection, {
        accountNumber,
        accountHolderName,
        openingBalance,
      });

      const account = await this.accountRepository.findById(connection, accountId);

      await connection.commit();

      return account;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getAccountById(accountId) {
    const connection = await this.db.getConnection();

    try {
      const account = await this.accountRepository.findById(connection, accountId);

      if (!account) {
        throw new ApiError(404, 'Account not found');
      }

      return account;
    } finally {
      connection.release();
    }
  }
}

module.exports = AccountService;