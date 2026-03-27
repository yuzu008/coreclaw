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

## Steering（研究者向け方針）
- steering/product.ja.md
- steering/structure.ja.md
- steering/tech.ja.md
- steering/project.yml
- steering/rules/constitution.md
