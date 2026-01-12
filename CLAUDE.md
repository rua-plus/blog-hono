```
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
```

## Project Overview

A simple blog API built with Hono (web framework) and PostgreSQL (database) in
Deno.

## Key Technologies

- **Deno**: JavaScript/TypeScript runtime (version 2.6.3 or later)
- **Hono**: Web framework for building APIs
- **PostgreSQL**: Relational database
- **postgres.js**: PostgreSQL client for JavaScript/TypeScript
- **Zod**: Schema validation library
- **Argon2**: Password hashing and verification
- **nanoid**: Unique ID generation
- **Hono JWT**: JWT (JSON Web Token) implementation for authentication

## Development Commands

### Running the Application

```bash
deno task start
```

This runs the API server with required permissions:

- --allow-net: Allow network access
- --allow-read: Allow file reading (for config.json)
- --allow-env: Allow environment access
- --allow-ffi: Allow FFI for Argon2 hashing

### Running Tests

```bash
deno test
```

To run a single test file:

```bash
deno test test/password.test.ts
```

### Linting

```bash
deno lint
```

### Formatting

```bash
deno fmt
```

## Code Architecture

### Main Entry Point

**main.ts** - Entry point of the application

- Creates Hono app instance
- Enables CORS middleware
- Enables request ID middleware
- Enables detailed logger middleware (with requestId)
- Registers all API routes
- Handles database connection on startup
- Serves the API

### Core Modules

1. **utils/config.ts**: Configuration management
   - Defines Config interface for type safety
   - Reads and parses configuration from config.json
   - Handles errors with handleError() function
   - Exports parseConfigFile() and handleError()

2. **utils/db.ts**: Database connection management
   - Imports PostgreSQL client from postgres.js
   - Connects to PostgreSQL using configuration from config.json
   - Exports connectDB() and closeDB() functions
   - Handles errors with formatErrorMessage() function

3. **response.ts**: Response utilities
   - Defines StatusCode enum with HTTP and business status codes
   - Provides response helper functions:
     - successResponse(): Standard success response
     - errorResponse(): Standard error response
     - paginationResponse(): Pagination response
     - honoSuccessResponse(): Hono-specific success response
     - honoErrorResponse(): Hono-specific error response
     - honoPaginationResponse(): Hono-specific pagination response

4. **middleware.ts**: Custom middleware
   - requestIdMiddleware: Generates unique request ID for each request
   - detailedLoggerMiddleware: Logs detailed request/response information with
     requestId
   - jwtAuthMiddleware: JWT authentication middleware that verifies tokens and
     extracts user information

5. **routes/**: API route handlers
   - **index.ts**: Main route registration
     - GET /: Returns "RUA" message (welcome endpoint)
     - Handles 404 (Not Found) errors
     - Handles 405 (Method Not Allowed) errors
   - **users.ts**: User-related routes
     - POST /users/create: Creates a new user with validation
     - POST /users/login: User login endpoint with JWT token generation
   - **posts.ts**: Post-related routes
     - GET /posts/list: Lists all posts with pagination, date filtering, and
       status filtering (includes author information)
     - GET /posts/:postId: Gets detailed information of a single post by ID
       (includes author information)
     - POST /posts/create: Creates a new post (requires JWT authentication)

6. **utils/**: Utility functions
   - **password.ts**: Password hashing and verification using Argon2
   - **jwt.ts**: JWT token generation and verification utilities
     - generateToken(): Generates JWT with custom payload
     - verifyToken(): Verifies and decodes JWT
     - generateUserToken(): Generates user-specific JWT with expiration
   - **logger.ts**: Logger utility with various log levels and requestId support

7. **types/**: Type definitions
   - **context.ts**: Extends Hono context with user information for authenticated routes

8. **test/**: Test files
   - **password.test.ts**: Tests for password hashing and verification
   - **jwt.test.ts**: Tests for JWT token generation and verification

9. **lib/sql/**: Database schema (submodule)
   - Contains SQL files for initializing database tables (users, posts,
     categories, comments, tags, media)

### Configuration

Database connection settings are stored in `config.json`. A template is
available at `config.example.json`.

```json
{
  "postgresql": {
    "host": "localhost",
    "port": 5432,
    "database": "blog_db",
    "user": "postgres",
    "password": "your_password"
  },
  "jwt": {
    "secret": "your-secret-key-change-in-production",
    "expiresIn": "7d"
  }
}
```

### API Routes

- **GET /**: Returns "RUA" message (welcome endpoint)
- **POST /users/create**: Creates a new user with validation
- **POST /users/login**: User login with username/email and password, returns
  JWT token
- **GET /posts/list**: Lists all posts with pagination, date filtering, and
  status filtering (includes author information)
- **GET /posts/:postId**: Gets detailed information of a single post by ID
  (includes author information)
- **POST /posts/create**: Creates a new post (requires JWT authentication)

### Error Handling

- Configuration errors handled in `utils/config.ts:handleError()`
- Database errors handled in `utils/db.ts:formatErrorMessage()`
- Error responses via `honoErrorResponse()` function
- Success responses via `honoSuccessResponse()` function
- Validation errors handled by Zod validator middleware
- 404 errors handled by notFound middleware
- 405 errors and other errors handled by onError middleware

### Database Schema

The database schema is defined in `lib/sql/sql/init.sql` and includes the
following tables:

1. **users**: User information (id, username, email, password_hash, avatar_url,
   bio, last_login, created_at, updated_at)
2. **posts**: Blog posts (id, title, slug, content, excerpt, author_id, status,
   published_at, created_at, updated_at)
3. **categories**: Post categories (id, name, slug, description, parent_id)
4. **comments**: Post comments (id, post_id, user_id, parent_id, author_name,
   author_email, content, status, created_at, updated_at)
5. **tags**: Post tags (id, name, slug)
6. **media**: Media files (id, filename, file_path, file_type, file_size,
   uploader_id, alt_text, created_at)
