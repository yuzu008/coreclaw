# 領域プリセット導入 要件定義（2026-04-05）

## 背景
CoreClaw は研究ワークベンチとして運用しているが、領域ごとの初期設定（スキル/MCP/回答方針）が都度手作業で、再現性と起動速度にばらつきがある。

## 目的
社会学・経営学・宗教学・哲学の4領域について、実験作成時に即時適用できるプリセットを提供する。

## 非目標
- UIデザインの全面改修
- 外部データソースの自動収集ロジック追加
- 既存実験の一括移行

## 受入条件
- API で領域プリセット一覧を取得できること
- API で `preset_id` 指定時に実験を既定値で生成できること
- 不正な `preset_id` は 400 で拒否されること
- プリセット定義の単体テストが通ること

## 要件（EARS）
- F-401 (Ubiquitous): システムは、領域プリセットの一覧を常に提供しなければならない。
- F-402 (Event-driven): ユーザーが `POST /api/experiments` で `preset_id` を指定したとき、システムはプリセット既定値（name/description/skill/mcp_servers）を適用して実験を作成しなければならない。
- F-403 (Event-driven): ユーザーが不正な `preset_id` を指定したとき、システムは 400 エラーを返さなければならない。
- F-404 (State-driven): プリセットを適用して実験を作成したとき、システムは初期システムメッセージとして領域方針を保存しなければならない。

## テスト方針（Red-Green-Blue）
- Red: プリセット解決ロジックの期待仕様を `src/domain-presets.test.ts` に先に記述
- Green: `src/domain-presets.ts` と `src/web-server.ts` に最小実装を追加
- Blue: 型チェックと既存影響確認を実施

## トレーサビリティ（要件→設計→実装→テスト）
- F-401 -> DES-401 -> `src/domain-presets.ts` -> `src/domain-presets.test.ts` の `returns four well-known presets`
- F-402 -> DES-402 -> `src/web-server.ts` (`POST /api/experiments` preset適用) -> `src/domain-presets.test.ts` の `resolves preset config`
- F-403 -> DES-403 -> `src/web-server.ts` (`Unknown preset_id`) -> 手動API確認項目
- F-404 -> DES-404 -> `src/domain-presets.ts` / `src/web-server.ts` (presetSystemMessage 追加) -> 手動API確認項目
