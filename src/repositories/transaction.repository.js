class TransactionRepository {
  async createTransaction(connection, payload) {
    const {
      referenceId,
      type,
      fromAccountId,
      toAccountId,
      amount,
      status,
      description,
    } = payload;

    const [result] = await connection.execute(
      `INSERT INTO transactions
       (reference_id, type, from_account_id, to_account_id, amount, status, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [referenceId, type, fromAccountId, toAccountId, amount, status, description]
    );

    return result.insertId;
  }

  async getTransactionsByAccountId(connection, accountId) {
    const [rows] = await connection.execute(
      `SELECT id, reference_id, type, from_account_id, to_account_id, amount, status, description, created_at
       FROM transactions
       WHERE from_account_id = ? OR to_account_id = ?
       ORDER BY created_at DESC`,
      [accountId, accountId]
    );

    return rows;
  }
}

module.exports = TransactionRepository;