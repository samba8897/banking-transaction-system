const { z } = require('zod');

const createAccountSchema = z.object({
  accountHolderName: z
    .string()
    .trim()
    .min(3, 'Account holder name must be at least 3 characters long'),

  openingBalance: z
    .number()
    .min(0, 'Opening balance cannot be negative')
    .default(0),
});

module.exports = {
  createAccountSchema,
};