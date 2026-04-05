# Handoff

## 社内デモでの冒頭説明（そのまま読み上げ可）
WSL上でCoreClawを起動し、gh認証済みトークンを.envに設定、Dockerコンテナで安全に実行できる状態まで構築済みです。http://localhost:3000 で起動し、MCP（ToolUniverse / deep-research）設定と用途別チャットグループ（general / scientist / consultant / educationalist）まで初期化済みです。

## 短縮版
CoreClawはWSL+Dockerで起動済み。MCP連携と用途別グループまでセットアップ済みで、すぐにデモ可能です。

## 補足（質問されたとき用）
- 必須前提: Copilot利用権、gh auth login、Docker
- 起動コマンド: npm start
- 画面: http://localhost:3000
- セキュリティ注意: トークンは定期ローテーション

## MUSUBIx 憲法（9条項）
- Library-First
- CLI Interface
- Test-First
- EARS Format
- Traceability
- Project Memory
- Design Patterns
- Decision Records
- Quality Gates

## フェーズ運用（重要）
- 要件定義 -> 設計 -> タスク分解 -> 実装の順で進行
- 各フェーズでレビュー結果を提示し、承認を得てから次へ進む
- 設計から実装へ直接進まない

## 現在の初期グループ
- Getting Started Auto（general-assistant）
- Scientist Workspace（scientist）
- Consulting Workspace（consultant）
- Education Workspace（educationalist）

## 次回会話の冒頭告知ルール
次回の会話開始時に、デモ向け状態（起動済み・MCP設定済み・初期グループ作成済み）を最初にユーザーへ告知する。

## 研究者向けアプリ構想の保存先
- docs/researcher-workbench-idea.md

## K-Dense Skill 導入計画（2026-04-02 追記）
- docs/kdense-skill-adoption-batch-a.md

### K-Dense Batch A 実施状況（2026-04-02 更新）
- 取り込み完了
	- skills/scientist/scientific-database-lookup
	- skills/scientist/scientific-exploratory-data-analysis
	- skills/scientist/scientific-citation-management
- skill-scanner 結果（docs/kdense-skill-scanner-2026-04-02.md）
	- scientific-database-lookup: SAFE（Critical 0）
	- scientific-exploratory-data-analysis: SAFE（Critical 0）
	- scientific-citation-management: ISSUES FOUND（Critical 4, Medium 6）
- 方針
	- scientific-citation-management は有効化保留
	- 残り 2 スキルで smoke prompt を先行実施
	- 実行プロンプト: docs/demo-prompts.md の「9. K-Dense Batch A Smoke Prompt（導入検証）」
	- API smoke 記録: docs/kdense-batch-a-api-smoke-2026-04-02.md
	- 注意: 現在 headless mode のため、実応答検証は UI/接続チャネル上で実施する

### セッション終了処理（2026-04-02）
- 会話記録: docs/sessions/2026-04-02_kdense-batch-a_adoption-session.md
- 日報更新: docs/daily-report-2026-04-02.md
- サーバー状態: 停止済み（localhost:3000 応答停止を確認）

## 重要外部資料（2026-03-28 追記）
- docs/qiita-important-notes-2026-03-28.md

## Science 切り出し計画（2026-03-28 追記）
- docs/science-platform-mvp-plan-2026-03-28.md

## Steering（研究者向け方針）
- steering/product.ja.md
- steering/structure.ja.md
- steering/tech.ja.md
- steering/project.yml
- steering/rules/constitution.md

## 2026-03-27 作業引き継ぎ
- GitHub 側更新（Marketplace 機能を含む）をローカルへ反映済み
- `main` は `origin/main` と同期済み（確認時点で差分 0/0）
- ローカルコミット作成済み: `f019f39`（ローカルのみ）
- サーバーは終了処理で停止済み（`localhost:3000` 応答なしを確認）

## Git remote 現在値（要確認済み）
- origin (fetch): `https://github.com/nahisaho/coreclaw`
- origin (push): `https://github.com/yuzu008/coreclaw`
- upstream: `https://github.com/nahisaho/coreclaw`

## 次回開始時の確認項目
- `docker info` が通ること
- 必要時のみ `npm start` で起動
- push はユーザー明示許可が出るまで実行しない

## 2026-03-31 作業引き継ぎ（Science-colabo）
- 実装完了
	- `POST /api/runs/:id/cancel` を追加
	- Run 一覧/詳細で `provenance` 構造化返却を追加
	- Playwright E2E 最小シナリオ（Run 作成 -> 実行 -> report.md 確認）を追加
	- 実コンテナ実行基盤へ接続（Docker backend）
- ドキュメント反映済み
	- Science-colabo `docs/design.md`
	- Science-colabo `docs/api-contract.md`
	- Science-colabo `README.md`
- 検証
	- typecheck/test は通過（14 tests passed）
	- E2E は `test-results/.last-run.json` の `status` で合否確認可能（端末出力が不安定でも判定できる）
	- E2E ログは `npm run test:e2e:logged` で `playwright-logs/` に保存可能
	- docker backend 手動確認: `execute` が `succeeded` まで到達し、`report.md`/`figures/`/`results/` を登録できる

### Science-colabo 起動（docker backend）
- 例: `PORT=4000 EXECUTION_BACKEND=docker npm start`
- 主要 env
	- `EXECUTION_BACKEND=demo|docker|none`
	- `RUN_WORK_ROOT_DIR`（既定: `data/runs`）
	- `SCIENCE_EXEC_IMAGE`（既定: `alpine:3.20`）
	- `SCIENCE_EXEC_COMMAND`（既定: 成果物3点を生成）

### Science-colabo CI
- GitHub Actions: `.github/workflows/ci.yml`
	- `typecheck` / `test` / `test:e2e:logged` を実行
	- `playwright-logs/` と `test-results/` を artifacts として保存

## 次回の最優先タスク
- GitHub Actions の実行結果（Artifacts の中身含む）を GitHub 上で目視確認
- Docker backend のデフォルト command/image を「研究用の本コマンド/本イメージ」に置き換える設計
