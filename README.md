# Backend Ledger

Express API that records money movement as an append only ledger. A transfer writes one debit and one credit. Account balance is not stored, it is the sum of credits minus the sum of debits for that account.

## Stack

- Node.js, Express 5
- MongoDB with Mongoose
- JWT in an HTTP cookie or an `Authorization: Bearer` header
- bcrypt for passwords
- Nodemailer with Gmail OAuth for registration and transfer mail

## How a transfer is stored

1. A transaction row is created as `PENDING`, keyed by a unique `idempotencyKey`.
2. A `DEBIT` ledger row is written for the source account and a `CREDIT` ledger row for the destination, both tied to that transaction.
3. The transaction is marked `COMPLETED` and the MongoDB session is committed.

Ledger rows are meant to stay as written. A correction is another pair of entries, not an edit of the original rows. `getBalance` aggregates that account's ledger and returns `0` when there are no rows.

Multi-document transactions need a replica set or `mongos`. A standalone `mongod` will reject `startSession`.

## Setup

```bash
npm install
```

Create a `.env` in the project root:

```
MONGO_URI=mongodb://127.0.0.1:27017/backend_ledger?replicaSet=rs0
JWT_SECRET=replace-me
EMAIL_USER=
CLIENT_ID=
CLIENT_SECRET=
REFRESH_TOKEN=
```

`EMAIL_USER`, `CLIENT_ID`, `CLIENT_SECRET`, and `REFRESH_TOKEN` are the Gmail OAuth credentials Nodemailer uses. Registration and transfer mail fail if they are missing.

```bash
npm run dev    # nodemon
npm start      # node server.js
```

The server listens on port `3000`. `GET /` returns `Ledger service is up and running`.

## Auth

`POST /api/auth/register` and `POST /api/auth/login` sign a JWT that expires in 30 days, set it as the `token` cookie, and return it in the JSON body. Protected routes accept that cookie or `Authorization: Bearer <token>`.

`POST /api/auth/logout` stores the token in a blacklist. Later requests that present that token are rejected. The blacklist entry expires after three days.

Register body:

```json
{
  "email": "ada@example.com",
  "password": "secret1",
  "name": "Ada"
}
```

Login body:

```json
{
  "email": "ada@example.com",
  "password": "secret1"
}
```

Passwords must be at least 6 characters. Email is stored lowercased and must be unique.

## Accounts

All account routes require a logged-in user.

| Method | Path | What it does |
| --- | --- | --- |
| `POST` | `/api/accounts` | Opens an `ACTIVE` account in `INR` for the caller. No body. |
| `GET` | `/api/accounts` | Lists the caller's accounts. |
| `GET` | `/api/accounts/balance/:accountId` | Returns the derived balance. `400` if the account is missing or belongs to someone else. |

A new account starts at `0`.

## Transfers

`POST /api/transactions` requires a logged-in user.

```json
{
  "fromAccount": "<account id>",
  "toAccount": "<account id>",
  "amount": 100,
  "idempotencyKey": "8f3c1a0e-4b2d-4e7a-9c11-2d6f0a91b3e4"
}
```

- `amount` must be at least `1`.
- Both accounts must exist and have status `ACTIVE`.
- The source balance must cover `amount`.
- The same `idempotencyKey` is not inserted twice. A key that already completed returns `200` and the stored transaction. A key still `PENDING` returns `200` with a pending message.

`POST /api/transactions/system/initial-funds` is the opening-funds route. It expects a system user and this body:

```json
{
  "toAccount": "<account id>",
  "amount": 1000,
  "idempotencyKey": "opening-funds-1"
}
```

## Data

| Collection | Holds |
| --- | --- |
| `user` | Email, name, hashed password, and a `systemUser` flag (hidden by default, immutable). |
| `account` | User, status (`ACTIVE`, `FROZEN`, `CLOSED`), currency (default `INR`). |
| `transaction` | Source, destination, amount, status (`PENDING`, `COMPLETED`, `FAILED`, `REVERSED`), unique `idempotencyKey`. |
| `ledger` | Account, amount, transaction, and type (`CREDIT` or `DEBIT`). |
| `blacklist` | Logged-out tokens, unique, with a three-day TTL. |
