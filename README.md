# Blog API with Hono and PostgreSQL

A simple blog API built with Hono and PostgreSQL in Deno.

## Features

- Hono web framework
- PostgreSQL database connection
- Configuration file support (config.json)

## Installation

1. Ensure Deno is installed (version 2.6.3 or later)
2. Install PostgreSQL on your system
3. Create a database named `blog_db`
4. Update `config.json` with your PostgreSQL credentials

## Configuration

The `config.json` file contains the database connection settings:

```json
{
  "postgresql": {
    "host": "localhost",
    "port": 5432,
    "database": "blog_db",
    "user": "postgres",
    "password": "your_password"
  }
}
```

## Running the Application

```bash
deno task start
```

## API Routes

- GET / - Hello Hono!
- GET /test-db - Test database connection

## Development

### Database Connection

The database connection is managed in `lib/db.ts`. It reads configuration from `config.json` and provides the `db` client instance.

### Adding New Routes

To add new routes, edit `main.ts` and use Hono's routing methods.
