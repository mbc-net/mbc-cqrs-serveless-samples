import { TableType } from '@mbc-cqrs-serverless/core';
import * as request from 'supertest';
import { config, getTableName } from './config';

describe('Version Management Test', () => {
  const API_PATH = '/items';

  describe('Sequential Version Management', () => {
    it('should process sequential versions correctly for the same PK/SK combination', async () => {
      // Preparation
      const payload = {
        pk: 'TEST#VERSION',
        sk: 'sequential#1',
        id: 'TEST#VERSION#sequential#1',
        name: 'Sequential Version Test',
        version: 0,
        type: 'TEST',
      };

      // Execution - Create
      const createRes = await request(config.apiBaseUrl)
        .post(API_PATH)
        .send(payload);

      // Verification - Should be created with version 1
      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.version).toBe(1);

      // Execution - Update
      const updateRes = await request(config.apiBaseUrl)
        .put(`${API_PATH}/${payload.id}`)
        .send({
          ...payload,
          version: 1,
          name: 'Updated Name',
        });

      // Verification - Should increment to version 2
      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.version).toBe(2);
    });
  });

  describe('Independent Version Sequences', () => {
    it('should maintain independent version sequences for different PK/SK combinations', async () => {
      // Preparation
      const item1 = {
        pk: 'TEST#SEQ1',
        sk: 'item#1',
        id: 'TEST#SEQ1#item#1',
        name: 'Sequence 1',
        version: 0,
        type: 'TEST',
      };

      const item2 = {
        pk: 'TEST#SEQ2',
        sk: 'item#1',
        id: 'TEST#SEQ2#item#1',
        name: 'Sequence 2',
        version: 0,
        type: 'TEST',
      };

      // Execution - Create both items
      const res1 = await request(config.apiBaseUrl)
        .post(API_PATH)
        .send(item1);

      const res2 = await request(config.apiBaseUrl)
        .post(API_PATH)
        .send(item2);

      // Verification - Both should start with version 1
      expect(res1.body.version).toBe(1);
      expect(res2.body.version).toBe(1);

      // Execution - Update first item
      const updateRes = await request(config.apiBaseUrl)
        .put(`${API_PATH}/${item1.id}`)
        .send({
          ...item1,
          version: 1,
          name: 'Updated Sequence 1',
        });

      // Verification - First item version should increase, second item should remain unchanged
      expect(updateRes.body.version).toBe(2);

      const getRes = await request(config.apiBaseUrl)
        .get(`${API_PATH}/${item2.id}`);

      expect(getRes.body.version).toBe(1);
    });
  });

  describe('Optimistic Locking', () => {
    it('should handle version conflicts appropriately during concurrent updates', async () => {
      // Preparation
      const payload = {
        pk: 'TEST#VERSION',
        sk: 'conflict#1',
        id: 'TEST#VERSION#conflict#1',
        name: 'Conflict Test',
        version: 0,
        type: 'TEST',
      };

      // Execution - Create item
      const createRes = await request(config.apiBaseUrl)
        .post(API_PATH)
        .send(payload);

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.version).toBe(1);

      // Execution - First update succeeds
      const update1 = await request(config.apiBaseUrl)
        .put(`${API_PATH}/${payload.id}`)
        .send({
          ...payload,
          version: 1,
          name: 'First Update',
        });

      // Execution - Second update with same version fails
      const update2 = await request(config.apiBaseUrl)
        .put(`${API_PATH}/${payload.id}`)
        .send({
          ...payload,
          version: 1,
          name: 'Second Update',
        });

      // Verification
      expect(update1.statusCode).toBe(200);
      expect(update1.body.version).toBe(2);
      expect(update2.statusCode).toBe(409); // Conflict error
    });
  });
});
