import { TableType } from '@mbc-cqrs-serverless/core';

export const config = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  region: process.env.AWS_REGION || 'ap-northeast-1',
  endpoint: process.env.AWS_ENDPOINT || 'http://localhost:8000',
};

export const getTableName = (name: string, type: TableType) => {
  const stage = process.env.STAGE || 'local';
  return `${stage}-${name}-${type}`;
};
