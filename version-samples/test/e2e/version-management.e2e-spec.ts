import { TableType } from '@mbc-cqrs-serverless/core';
import * as request from 'supertest';
import { config, getTableName } from './config';

describe('バージョン管理テスト', () => {
  const API_PATH = '/items';

  describe('順次バージョン管理', () => {
    it('同一PK/SKの組み合わせで順次バージョンを正しく処理すること', async () => {
      // 準備
      const payload = {
        pk: 'TEST#VERSION',
        sk: 'sequential#1',
        id: 'TEST#VERSION#sequential#1',
        name: '順次バージョンテスト',
        version: 0,
        type: 'TEST',
      };

      // 実行 - 作成
      const createRes = await request(config.apiBaseUrl)
        .post(API_PATH)
        .send(payload);

      // 検証 - バージョン1で作成されること
      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.version).toBe(1);

      // 実行 - 更新
      const updateRes = await request(config.apiBaseUrl)
        .put(`${API_PATH}/${payload.id}`)
        .send({
          ...payload,
          version: 1,
          name: '更新後の名前',
        });

      // 検証 - バージョン2にインクリメントされること
      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.version).toBe(2);
    });
  });

  describe('独立したバージョンシーケンス', () => {
    it('異なるPK/SKの組み合わせで独立したバージョンシーケンスを維持すること', async () => {
      // 準備
      const item1 = {
        pk: 'TEST#SEQ1',
        sk: 'item#1',
        id: 'TEST#SEQ1#item#1',
        name: 'シーケンス1',
        version: 0,
        type: 'TEST',
      };

      const item2 = {
        pk: 'TEST#SEQ2',
        sk: 'item#1',
        id: 'TEST#SEQ2#item#1',
        name: 'シーケンス2',
        version: 0,
        type: 'TEST',
      };

      // 実行 - 両方のアイテムを作成
      const res1 = await request(config.apiBaseUrl)
        .post(API_PATH)
        .send(item1);

      const res2 = await request(config.apiBaseUrl)
        .post(API_PATH)
        .send(item2);

      // 検証 - 両方ともバージョン1で開始すること
      expect(res1.body.version).toBe(1);
      expect(res2.body.version).toBe(1);

      // 実行 - 最初のアイテムを更新
      const updateRes = await request(config.apiBaseUrl)
        .put(`${API_PATH}/${item1.id}`)
        .send({
          ...item1,
          version: 1,
          name: '更新後のシーケンス1',
        });

      // 検証 - 最初のアイテムのバージョンが上がり、2番目は変わらないこと
      expect(updateRes.body.version).toBe(2);

      const getRes = await request(config.apiBaseUrl)
        .get(`${API_PATH}/${item2.id}`);

      expect(getRes.body.version).toBe(1);
    });
  });

  describe('楽観的ロック', () => {
    it('同時更新時にバージョン競合を適切に処理すること', async () => {
      // 準備
      const payload = {
        pk: 'TEST#VERSION',
        sk: 'conflict#1',
        id: 'TEST#VERSION#conflict#1',
        name: '競合テスト',
        version: 0,
        type: 'TEST',
      };

      // 実行 - アイテム作成
      const createRes = await request(config.apiBaseUrl)
        .post(API_PATH)
        .send(payload);

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.version).toBe(1);

      // 実行 - 最初の更新は成功
      const update1 = await request(config.apiBaseUrl)
        .put(`${API_PATH}/${payload.id}`)
        .send({
          ...payload,
          version: 1,
          name: '最初の更新',
        });

      // 実行 - 同じバージョンでの2回目の更新は失敗
      const update2 = await request(config.apiBaseUrl)
        .put(`${API_PATH}/${payload.id}`)
        .send({
          ...payload,
          version: 1,
          name: '2回目の更新',
        });

      // 検証
      expect(update1.statusCode).toBe(200);
      expect(update1.body.version).toBe(2);
      expect(update2.statusCode).toBe(409); // 競合エラー
    });
  });
});
