class AccountRepository {
  async createAccount(connection, { accountNumber, accountHolderName, openingBalance }) {
    const [result] = await connection.execute(
      `INSERT INTO accounts (account_number, account_holder_name, balance)
       VALUES (?, ?, ?)`,
      [accountNumber, accountHolderName, openingBalance]
    );

    return result.insertId;
  }

  async findById(connection, accountId) {
    const [rows] = await connection.execute(
      `SELECT id, account_number, account_holder_name, balance, status, created_at, updated_at
       FROM accounts
       WHERE id = ?`,
      [accountId]
    );

    return rows[0] || null;
  }

  async findByIdForUpdate(connection, accountId) {
    const [rows] = await connection.execute(
      `SELECT id, account_number, account_holder_name, balance, status, created_at, updated_at
       FROM accounts
       WHERE id = ?
       FOR UPDATE`,
      [accountId]
    );

    return rows[0] || null;
  }

  async updateBalance(connection, accountId, newBalance) {
    await connection.execute(
      `UPDATE accounts
       SET balance = ?
       WHERE id = ?`,
      [newBalance, accountId]
    );
  }
}

module.exports = AccountRepository;