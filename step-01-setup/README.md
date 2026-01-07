# Step 01: Environment Setup

MBC CQRS Serverless Framework Tutorial - Step 1: Environment Setup

## What You'll Learn

- Setting up the development environment
- Starting the Docker environment
- Starting the local development server
- Verifying the health check endpoint

## Prerequisites

Make sure you have the following tools installed:

- **Node.js** 18.x or higher
- **Docker** and Docker Compose
- **AWS CLI** (configured for local development)
- **Git**

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.local .env
```

### 3. Start Docker Environment

```bash
npm run offline:docker
```

This will start the following services:
- DynamoDB Local (port 8000)
- DynamoDB Admin (port 8001)
- MySQL (port 3306)
- LocalStack - S3 (port 4566)
- Cognito Local (port 9229)
- Step Functions Local (port 8083)

### 4. Run Database Migrations

Open a new terminal and run:

```bash
npm run migrate
```

### 5. Start Development Server

```bash
npm run offline:sls
```

The server will start at `http://localhost:3000`.

## Verification

### Health Check

```bash
curl http://localhost:3000/health
```

If everything is working correctly, you'll receive a health check response.

## Project Structure

```
step-01-setup/
├── src/
│   ├── main.ts              # Lambda handler
│   ├── main.module.ts       # NestJS root module
│   ├── event-factory.ts     # Event factory
│   ├── repl.ts              # REPL mode
│   └── prisma/              # Prisma module
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── dynamodbs/           # DynamoDB table definitions
├── infra-local/             # Local development infrastructure
│   ├── docker-compose.yml
│   └── serverless.yml
├── package.json
└── .env.local               # Environment variables template
```

## Troubleshooting

### Docker Services Not Starting

1. Make sure Docker is running
2. Verify sufficient resources (memory, CPU) are allocated
3. Reset with the following commands:

```bash
cd infra-local && docker compose down && docker compose up -d
```

### Database Connection Errors

Wait a few seconds for MySQL to fully start, then run migrations again:

```bash
npm run migrate
```

### Port Conflicts

If ports 3000, 5432, 8000, etc. are in use, stop the conflicting services or change the port settings in `docker-compose.yml`.

## Navigation

| Previous | Next |
|----------|------|
| - | [Step 02: Create](../step-02-create/) |

## Related Resources

- **Documentation**: [Build a Todo App](https://mbc-cqrs-serverless.mbc-net.com/docs/build-todo-app)
- **Blog (Japanese)**: [Part 1: 環境構築](https://www.mbc-net.com/mbc-cqrs-サーバーレス-フレームワーク-to-do-システム作成-1/)
- [MBC CQRS Serverless Docs](https://mbc-cqrs-serverless.mbc-net.com/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
