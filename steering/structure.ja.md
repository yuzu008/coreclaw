# Architecture Structure (CoreClaw)

## 全体方針
- モノリシック運用 + 機能境界を明確化
- UI / API / Execution / Storage を分離
- 実験ライフサイクルを中心に構造化

## レイヤー
1. Presentation
- `public/` (Chat UI)
- 研究者向け画面の将来拡張（実験一覧、比較、再実行）

2. Application
- `src/web-server.ts`
- 実験作成、メッセージ管理、設定管理、WebSocket通知

3. Execution
- `src/index.ts`
- `src/container-runner.ts`
- `container/agent-runner/`
- エージェント実行、ストリーミング、タスク制御

4. Storage
- `src/experiments.ts`
- `data/` と `groups/`
- 実験メタデータ、メッセージ、成果物、ログ

## 研究者向け拡張ポイント
- Experiment Run モデル（実行条件、パラメータ、評価値）
- Artifact index（図表、表、原データ、派生データ）
- Provenance（生成根拠、使用設定、入力履歴）

## 禁止事項
- UIで見える状態とDB状態の不整合を放置しない
- 実験結果の上書きをデフォルトにしない（履歴保持）
- 生成物から設定情報を分離して保存しない
