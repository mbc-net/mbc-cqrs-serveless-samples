![MBC CQRS serverless framework](https://mbc-net.github.io/mbc-cqrs-serverless-doc/img/mbc-cqrs-serverless.png)

# MBC CQRS Serverless Framework Samples

This repository contains step-by-step tutorial samples for building applications with the MBC CQRS Serverless framework.

## Tutorial Structure

The samples are organized as progressive steps, each building on the previous one:

| Step | Description | Key Concepts |
|------|-------------|--------------|
| [step-01-setup](./step-01-setup) | Environment Setup | CLI, Docker, Local Development |
| [step-02-create](./step-02-create) | Create Operation | CommandService.publish(), PK/SK Design |
| [step-03-rds-sync](./step-03-rds-sync) | RDS Data Synchronization | IDataSyncHandler, Prisma, DynamoDB Streams |
| [step-04-read](./step-04-read) | Read Operation | DataService.getItem() |
| [step-05-search](./step-05-search) | Search/List Operations | CQRS Query Separation, RDS Search |
| [step-06-update-delete](./step-06-update-delete) | Update & Delete | publishPartialUpdate(), Optimistic Locking |
| [step-07-sequence](./step-07-sequence) | Sequence Numbers | SequencesService, Auto-incrementing IDs |

### Complete Examples

| Sample | Description |
|--------|-------------|
| [complete/basic](./complete/basic) | Full Todo application with all features |
| [complete/with-task](./complete/with-task) | Todo app + Async Task Processing |

## Quick Start

Each step can be run independently:

```bash
# Navigate to a step directory
cd step-02-create

# Install dependencies
npm install

# Terminal 1: Start Docker services (DynamoDB, MySQL, etc.)
npm run offline:docker

# Terminal 2: Run database migrations
npm run migrate

# Terminal 3: Start the serverless offline server
npm run offline:sls
```

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- AWS CLI (for local development)
- JQ CLI (optional, for debugging)

## Documentation

- **Full Documentation**: https://mbc-cqrs-serverless.mbc-net.com/
- **Tutorial Guide**: https://mbc-cqrs-serverless.mbc-net.com/docs/build-todo-app
- **API Reference**: https://mbc-cqrs-serverless.mbc-net.com/docs/api-reference

## Framework Packages

These samples use the following MBC CQRS Serverless packages (v1.0.16):

- `@mbc-cqrs-serverless/core` - Core CQRS functionality
- `@mbc-cqrs-serverless/sequence` - Sequence number generation
- `@mbc-cqrs-serverless/task` - Async task processing
- `@mbc-cqrs-serverless/cli` - CLI tools for project scaffolding

## Blog Tutorial (Japanese)

A detailed Japanese tutorial series is available:

1. [Part 1: 環境構築](https://www.mbc-net.com/mbc-cqrs-サーバーレス-フレームワーク-to-do-システム作成-1/)
2. [Part 2: 書き込み処理追加](https://www.mbc-net.com/mbc-cqrs-サーバーレス-フレームワーク-to-do-システム作成-2/)
3. [Part 3: RDSデータを反映](https://www.mbc-net.com/mbc-cqrs-サーバーレス-フレームワーク-to-do-システム作成-3/)
4. [Part 4: 特定のデータの読込](https://www.mbc-net.com/mbc-cqrs-サーバーレス-フレームワーク-to-do-システム作成-4/)
5. [Part 5: データの検索](https://www.mbc-net.com/mbc-cqrs-サーバーレス-フレームワーク-to-do-システム作成-5/)
6. [Part 6: データの更新・削除](https://www.mbc-net.com/mbc-cqrs-サーバーレス-フレームワーク-to-do-システム作成-6/)
7. [Part 7: シーケンス(採番)の実装](https://www.mbc-net.com/mbc-cqrs-サーバーレス-フレームワーク-to-do-システム作成-7/)

## License

Copyright &copy; 2024, Murakami Business Consulting, Inc. https://www.mbc-net.com/

This project and sub projects are under the MIT License.
