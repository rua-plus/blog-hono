```
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
```

## Project Overview

A simple blog API built with Hono (web framework) and PostgreSQL (database) in Deno.

## Key Technologies

- **Deno**: JavaScript/TypeScript runtime (version 2.6.3 or later)
- **Hono**: Web framework for building APIs
- **PostgreSQL**: Relational database
- **postgres.js**: PostgreSQL client for JavaScript/TypeScript

## Development Commands

### Running the Application

```bash
deno task start
```

This runs the API server with required permissions:
- --allow-net: Allow network access
- --allow-read: Allow file reading (for config.json)
- --allow-env: Allow environment access

### Dependencies

Dependencies are managed via Deno's import maps in `deno.json`:
- hono: ^4.11.3
- @db/postgres: ^0.19.5
- @sitnik/nanoid: ^5.1.5

## Code Architecture

### Main Files

1. **main.ts**: Entry point of the application
   - Creates Hono app instance
   - Defines API routes
   - Handles database connection on startup
   - Serves the API

2. **db.ts**: Database connection management
   - Reads configuration from config.json
   - Creates PostgreSQL client instance
   - Exports connectDB(), closeDB(), and db client
   - Handles errors with generic error handler

3. **response.ts**: Response utilities
   - Defines StatusCode enum with HTTP and business status codes
   - Provides response helper functions:
     - successResponse(): Standard success response
     - errorResponse(): Standard error response
     - paginationResponse(): Pagination response
     - honoSuccessResponse(): Hono-specific success response
     - honoErrorResponse(): Hono-specific error response
     - honoPaginationResponse(): Hono-specific pagination response

4. **config.json**: Database configuration
   - PostgreSQL connection settings (host, port, database, user, password)

### Configuration

Database connection settings are stored in `config.json`. A template is available at `config.example.json`.

### API Routes

- **GET /**: Returns "Hello Hono!" message (welcome endpoint)
- **GET /test-db**: Tests PostgreSQL connection and returns version

### Error Handling

- Generic error handler in `db.ts:handleError()`
- Error responses via `honoErrorResponse()` function
- Success responses via `honoSuccessResponse()` function

### Database Schema

SQL files are stored in `lib/sql/sql/` directory (submodule).
