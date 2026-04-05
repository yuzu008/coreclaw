# Tech Stack (CoreClaw)

## 基本技術
- Runtime: Node.js 20+
- Language: TypeScript
- Web: Node HTTP + WebSocket (`ws`)
- DB: SQLite (`better-sqlite3`)
- Container: Docker (container runtime)
- Testing: Vitest / Playwright

## 運用前提
- WSL + Docker
- GitHub/Copilot 認証
- MCP サーバー設定（必要に応じて）

## Git 運用方針（2026-03-27 追記）
- upstream（参照元）: `https://github.com/nahisaho/coreclaw`
- origin の fetch: `https://github.com/nahisaho/coreclaw`
- origin の push: `https://github.com/yuzu008/coreclaw`（フォーク）
- リモート取り込み時は `main...origin/main` の件数確認を必須とする
- 競合時は未解決状態（`UU`）を解消してから `pull --rebase` を実行する

## 設計上の技術方針
1. 同期API + 非同期ストリーミングの併用
2. 失敗時は API 再同期で最終整合を確保
3. 成果物はファイル保存し、DBは索引と履歴を保持
4. 研究用途ではログ欠損を障害として扱う

## 品質基準
- TypeScript 型安全を維持
- エラーの握りつぶし禁止
- 実験実行ログを必ず保存
- UIの進捗状態を明示（送信中/生成中/完了/失敗）

## Science-colabo MVP 方針（2026-03-31 追記）
- Run API の基準機能は `create/list/detail/execute/cancel/clone/artifact登録` を最小セットとする。
- Run 一覧/詳細は provenance を構造化 JSON で返却し、再現性確認の読み取りコストを下げる。
- E2E は UI 実装前でも API フローで先行整備し、`作成 -> 実行 -> 成果物確認` を最小回帰シナリオとする。
- 実コンテナ連携未完了期間は demo execute hook を許容するが、最終的に本実行経路へ置き換える。
- CI では失敗解析可能性を最優先し、E2E ログと `test-results/` を artifacts として常に保存する。
