const express = require('express');
const validate = require('../middlewares/validate.middleware');
const { createAccountSchema } = require('../validators/account.validator');

module.exports = (accountController) => {
  const router = express.Router();

  router.post('/accounts', validate(createAccountSchema), accountController.createAccount);
  router.get('/accounts/:id', accountController.getAccountById);

  return router;
};