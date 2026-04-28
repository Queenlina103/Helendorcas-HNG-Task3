# Zedu API Automation Test Suite

Automated API test suite for the [Zedu](https://zedu.chat) platform, built with **JavaScript (Node.js)** using **Jest** and **Axios**.

---

## Project Overview

This project validates the Zedu staging API across three core domains:

| Test File | Endpoints Covered |
|---|---|
| `tests/auth.test.js` | Register, Login, Logout, Password Reset, Magic Link |
| `tests/users.test.js` | Get Me, Get User, Organisations, Notification Prefs, Profile |
| `tests/organisations.test.js` | Create/Read/Update/Delete Org, Users, Roles |

**Total test cases: 30+** (≥10 negative, ≥5 edge cases)

---

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

---

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Open `.env` and set:

```env
BASE_URL=https://api.staging.zedu.chat/api/v1

TEST_EMAIL=your_existing_test_account@example.com
TEST_PASSWORD=your_password

TEST_EMAIL_2=your_second_test_account@example.com
TEST_PASSWORD_2=your_second_password
```

> **Note:** `TEST_EMAIL` / `TEST_PASSWORD` must be a pre-existing account on the staging environment. The register tests create their own throwaway accounts dynamically.

---

## Running the Tests

### Run the full suite

```bash
npm test
```

### Run a single test file

```bash
npm run test:auth
npm run test:users
npm run test:organisations
```

---

## Project Structure

```
.
├── tests/
│   ├── auth.test.js           # Auth endpoint tests (register, login, logout, etc.)
│   ├── users.test.js          # User profile and preferences tests
│   └── organisations.test.js  # Organisation CRUD and roles tests
├── utils/
│   ├── auth.js                # Shared login utility — all token logic lives here
│   └── helpers.js             # Dynamic data generators and axios client factories
├── .env.example               # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## Key Design Decisions

- **No hardcoded tokens or credentials** — everything flows from `.env` via `dotenv`
- **Shared auth utility** — `utils/auth.js` is the single source of truth for token retrieval
- **Dynamic test data** — emails and usernames are generated with timestamps + random suffixes to ensure idempotency
- **Independent tests** — each test fetches its own token; no test depends on another test's state
- **Meaningful assertions** — every test validates status code, response shape, field types, and field values beyond just a 200 OK
