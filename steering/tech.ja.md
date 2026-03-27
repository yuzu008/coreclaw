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
