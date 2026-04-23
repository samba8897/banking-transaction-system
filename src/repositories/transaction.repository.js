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

  async getTransactionsByAccountId(connection, accountId, limit, offset) {
    const safeLimit = Number(limit);
    const safeOffset = Number(offset);

    const [rows] = await connection.query(
      `SELECT id, reference_id, type, from_account_id, to_account_id, amount, status, description, created_at
       FROM transactions
       WHERE from_account_id = ? OR to_account_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [accountId, accountId]
    );

    return rows;
  }

  async countTransactionsByAccountId(connection, accountId) {
    const [rows] = await connection.execute(
      `SELECT COUNT(*) AS total
       FROM transactions
       WHERE from_account_id = ? OR to_account_id = ?`,
      [accountId, accountId]
    );

    return rows[0].total;
  }
}

module.exports = TransactionRepository;