const { z } = require('zod');

const amountSchema = z.object({
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be greater than zero'),
});

const transferSchema = z.object({
  fromAccountId: z
    .number({
      required_error: 'fromAccountId is required',
      invalid_type_error: 'fromAccountId must be a number',
    })
    .int('fromAccountId must be an integer')
    .positive('fromAccountId must be greater than zero'),

  toAccountId: z
    .number({
      required_error: 'toAccountId is required',
      invalid_type_error: 'toAccountId must be a number',
    })
    .int('toAccountId must be an integer')
    .positive('toAccountId must be greater than zero'),

  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be greater than zero'),
});

module.exports = {
  amountSchema,
  transferSchema,
};