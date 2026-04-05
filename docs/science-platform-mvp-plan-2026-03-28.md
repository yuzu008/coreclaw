# CoreClaw Science 切り出し MVP 計画（2026-03-28）

## 0. 目的
CoreClaw から Science 領域を中心に切り出し、研究者の再現可能な実験運用に寄与する専用アプリを開発する。

## 1. プロダクト定義
### 1.1 一言で
「研究チャット」ではなく「Experiment Run を管理する研究基盤」。

### 1.2 成果価値
- 実験条件、入力、コード、出力、ログを Run 単位で紐付け保存できる。
- 同条件で再実行できる。
- 論文・報告向け成果物（report, figures, results）を定型出力できる。

## 2. スコープ
### 2.1 MVP に含める
- Run 作成・実行・再実行・履歴表示
- Scientist 系 Skill 実行
- 成果物保存（`results/`, `figures/`, `report.md`）
- MCP（まず ToolUniverse プリセット）
- Docker 分離実行と最小セキュリティガード

### 2.2 MVP で含めない
- consultant / educationalist など Science 外スキル
- Marketplace の一般公開機能
- 高度なマルチエージェント協調
- 完全自動セルフアップデート

## 3. 要件（EARS）
- F-001（When）
  - When ユーザーが新規 Run を作成したとき、システムは Run ID を発行し、初期メタデータ（時刻、スキル構成、MCP設定）を保存しなければならない。
- F-002（While）
  - While エージェント実行中、システムは進捗イベントをストリーミング表示しなければならない。
- F-003（Where）
  - Where 実行結果に成果物が含まれる場合、システムは `results/` `figures/` `report.md` に保存し、Run と紐付けなければならない。
- F-004（If-Then）
  - If 実行が失敗した場合、Then システムは失敗理由、ログ、再実行手順を保存しなければならない。
- F-005（Optional）
  - Where ユーザーが再実行を要求した場合、システムは前回設定を複製して再実行できてもよい。
- NFR-001
  - システムはコンテナ分離を前提とし、ホスト秘密情報をコンテナへ直接渡してはならない。
- NFR-002
  - システムは最低限の監査性として、Run 単位の操作履歴を保持しなければならない。

## 4. CoreClaw からの切り出し方針
### 4.1 まず再利用するモジュール
- `src/web-server.ts`（API/WS 基盤）
- `src/index.ts`（オーケストレーション）
- `src/container-runner.ts` / `src/container-runtime.ts`（Docker 実行）
- `src/experiments.ts` / `src/db.ts`（Run と成果物の永続化）
- `src/skills-sync.ts`（Skill 同期）
- `src/credential-proxy.ts`（認証境界）
- `public/index.html`（UI 叩き台）

### 4.2 段階的に外すモジュール
- `skills/consultant*` / `skills/educationalist` / `skills/general-assistant`
- Marketplace 依存のUI要素
- Science 以外のセットアップ導線

### 4.3 新規追加候補
- `src/science-run-policy.ts`（Run 出力規約の検証）
- `src/provenance.ts`（入力・設定・成果物のトレーサビリティ集約）
- `public/science-dashboard` 相当 UI（Run 一覧・比較・再実行）

## 5. 4週間 MVP ロードマップ
### Week 1: Foundation
- スコープ固定（Science-only）
- 既存 API/DB の棚卸し
- 最小 Run モデルと DB スキーマ確認
- Docker 起動・実行・ログ保存の動作確認

### Week 2: Run-Centric UI/API
- Run 作成/一覧/詳細 API
- 実行中ステータス表示（WS）
- 成果物リンク表示
- 失敗ログ保持

### Week 3: Science Workflow
- Scientist スキル選択導線の最適化
- ToolUniverse プリセットの運用導線
- 出力規約チェック（results/figures/report）
- 再実行（clone run）

### Week 4: Hardening
- E2E シナリオ（正常系・失敗系・再実行）
- セキュリティ確認（トークン境界、危険スキルの取り扱い）
- ドキュメント整備（運用手順、制約、既知課題）

## 6. 受け入れ条件（MVP Done）
- 3本の代表ワークフローが再現可能
  - 文献検索 → 要約
  - 仮説立案 → 解析
  - 可視化 → report 生成
- すべて Run 単位で再実行可能
- 成果物が規約ディレクトリへ保存される
- 主要失敗ケースで復旧手順が提示される

## 7. リスクと対策
- リスク: Science スキル依存が高く、失敗時の原因分離が難しい
  - 対策: Run ごとに入力・ツール呼び出し・エラーを構造化保存
- リスク: MCP 側の可用性に依存
  - 対策: MCP なしフォールバック経路を最低1本維持
- リスク: UI が汎用チャットのままで運用が散る
  - 対策: Run 一覧を主画面に昇格し、チャットを補助に落とす

## 8. 直近の実装開始タスク（優先順）
1. Science-only 起動モード（表示スキル制限）
2. Run 作成 API に設定スナップショット保存
3. 成果物規約チェック（results/figures/report）
4. Run 再実行 API（前回設定 clone）
5. E2E: 1本目の文献検索パイプライン
