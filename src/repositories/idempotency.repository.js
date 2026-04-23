class IdempotencyRepository {
  async findByKey(connection, idempotencyKey) {
    const [rows] = await connection.execute(
      `SELECT id, idempotency_key, request_hash, response_body, status, created_at, updated_at
       FROM idempotency_keys
       WHERE idempotency_key = ?`,
      [idempotencyKey]
    );

    return rows[0] || null;
  }

  async createKey(connection, { idempotencyKey, requestHash }) {
    const [result] = await connection.execute(
      `INSERT INTO idempotency_keys (idempotency_key, request_hash, status)
       VALUES (?, ?, 'PROCESSING')`,
      [idempotencyKey, requestHash]
    );

    return result.insertId;
  }

  async markCompleted(connection, idempotencyKey, responseBody) {
    await connection.execute(
      `UPDATE idempotency_keys
       SET status = 'COMPLETED',
           response_body = ?
       WHERE idempotency_key = ?`,
      [JSON.stringify(responseBody), idempotencyKey]
    );
  }

  async markFailed(connection, idempotencyKey) {
    await connection.execute(
      `UPDATE idempotency_keys
       SET status = 'FAILED'
       WHERE idempotency_key = ?`,
      [idempotencyKey]
    );
  }
}

module.exports = IdempotencyRepository;