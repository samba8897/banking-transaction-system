const express = require('express');
const pool = require('./config/db');

const errorMiddleware = require('./middlewares/error.middleware');

const AccountRepository = require('./repositories/account.repository');
const TransactionRepository = require('./repositories/transaction.repository');
const IdempotencyRepository = require('./repositories/idempotency.repository');

const AccountService = require('./services/account.service');
const TransactionService = require('./services/transaction.service');

const AccountController = require('./controllers/account.controller');
const TransactionController = require('./controllers/transaction.controller');

const accountRoutes = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.routes');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

const accountRepository = new AccountRepository();
const transactionRepository = new TransactionRepository();
const idempotencyRepository = new IdempotencyRepository();

const accountService = new AccountService(pool, accountRepository);
const transactionService = new TransactionService(
  pool,
  accountRepository,
  transactionRepository,
  idempotencyRepository
);

const accountController = new AccountController(accountService);
const transactionController = new TransactionController(transactionService);

app.use('/api/v1', accountRoutes(accountController));
app.use('/api/v1', transactionRoutes(transactionController));

app.use(errorMiddleware);

module.exports = app;