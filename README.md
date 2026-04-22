# Banking Transaction System (Backend)

A backend system for managing banking operations including account creation, deposits, withdrawals, fund transfers, and transaction history.

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

## API Endpoints

### Accounts
- `POST /api/v1/accounts` — Create account  
- `GET /api/v1/accounts/:id` — Get account details  

### Transactions
- `POST /api/v1/accounts/:accountId/deposit` — Deposit money  
- `POST /api/v1/accounts/:accountId/withdraw` — Withdraw money  
- `POST /api/v1/transactions/transfer` — Transfer money  
- `GET /api/v1/accounts/:accountId/transactions` — Get transaction history  

### Utility
- `GET /health` — Health check  

---

## Key Backend Concepts Implemented
- ACID-compliant transaction handling  
- Rollback safety for failed operations  
- Row-level locking for concurrency control  
- Deadlock-safe ordered locking during transfers  
- Layered architecture using controllers, services, and repositories  


### 1. Clone the repository
```bash
git clone https://github.com/samba8897/banking-transaction-system.git
cd banking-transaction-system

