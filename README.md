# Banking Transaction System (Backend)

A production-style backend system for managing banking operations including account creation, deposits, withdrawals, fund transfers, and transaction history.

Built with a focus on **data consistency, concurrency safety, and clean architecture**.

## Features
- Account creation
- Deposit money
- Withdraw money
- Transfer money between accounts
- Transaction history
- ACID-compliant SQL transactions
- Row-level locking using `SELECT ... FOR UPDATE`
- Rollback protection
- Input validation with Zod
- Automated API tests with Jest and Supertest

## Tech Stack
- Node.js
- Express.js
- MySQL
- Zod
- Jest
- Supertest

---

## ⚙️ Setup Instructions

# Clone repository
git clone https://github.com/samba8897/banking-transaction-system.git
cd banking-transaction-system

# Install dependencies
npm install

# Run database schema (open MySQL CLI first)
# mysql -u root -p
# then inside MySQL:
SOURCE sql/schema.sql;

# Start server
npm run dev

# Run tests (stop server before running)
npm test