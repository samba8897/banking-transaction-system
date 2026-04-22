const express = require('express');
const validate = require('../middlewares/validate.middleware');
const { amountSchema, transferSchema } = require('../validators/transaction.validator');

module.exports = (transactionController) => {
  const router = express.Router();

  router.post(
    '/accounts/:accountId/deposit',
    validate(amountSchema),
    transactionController.deposit
  );

  router.post(
    '/accounts/:accountId/withdraw',
    validate(amountSchema),
    transactionController.withdraw
  );

  router.post(
    '/transactions/transfer',
    validate(transferSchema),
    transactionController.transfer
  );

  router.get(
    '/accounts/:accountId/transactions',
    transactionController.getAccountTransactions
  );

  return router;
};