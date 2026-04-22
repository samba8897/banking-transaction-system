const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/response');

class AccountController {
  constructor(accountService) {
    this.accountService = accountService;
  }

  createAccount = asyncHandler(async (req, res) => {
    const account = await this.accountService.createAccount(req.body);

    return sendResponse(res, 201, 'Account created successfully', account);
  });

  getAccountById = asyncHandler(async (req, res) => {
    const account = await this.accountService.getAccountById(Number(req.params.id));

    return sendResponse(res, 200, 'Account fetched successfully', account);
  });
}

module.exports = AccountController;