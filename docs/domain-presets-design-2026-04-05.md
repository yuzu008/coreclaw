# 領域プリセット導入 設計（2026-04-05）

## 設計方針
- 既存の実験作成APIを拡張し、互換性を維持する
- 領域知識はDBではなくコード定義（型付き）で管理する
- 失敗時は明確な 400 エラーを返す

## コンポーネント設計

### DES-401: 領域プリセット定義モジュール
- 新規 `src/domain-presets.ts` を追加
- 4領域の固定IDと既定値を定義
- API/実装双方から利用する純粋関数を提供

公開関数:
- `listDomainPresets()`
- `getDomainPreset(presetId)`
- `resolvePresetConfig(presetId, fallbackName)`

### DES-402: 実験作成APIのpreset適用
- `POST /api/experiments` に `preset_id` を任意項目として追加
- `preset_id` が有効な場合のみ既定値を注入
- リクエスト明示値（name/description/skill/mcp_servers）がある場合はそちらを優先

### DES-403: エラーハンドリング
- `preset_id` が存在するが未定義IDの場合は `400 { error: 'Unknown preset_id' }`

### DES-404: 初期コンテキスト注入
- 既存 `DEMO_STARTUP_NOTICE` に加えて、プリセット方針を `system` メッセージとして追記
- これにより会話開始時点のドメイン文脈を安定化

## 互換性
- `preset_id` を指定しない既存クライアントは完全互換
- 既存 `POST /api/experiments` パラメータは維持

## ロールバック
- `src/domain-presets.ts` の利用箇所を除去し、`POST /api/experiments` の既存経路に戻せば機能停止可能

## テスト設計
- `src/domain-presets.test.ts`
  - 4プリセットが返る
  - preset解決結果が期待通り
  - 不正IDで null
- CIゲート
  - `npm run test -- src/domain-presets.test.ts`
  - `npm run typecheck`
