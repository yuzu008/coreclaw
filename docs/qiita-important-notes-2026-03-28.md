# Qiita 重要情報整理メモ（2026-03-28）

## 対象URL
- https://qiita.com/hisaho/items/4cb500819cb538324859
- https://qiita.com/hisaho/items/3efbb07ba9f05b9dcdd4
- https://qiita.com/hisaho/items/9c33c0f6bcfa719ea63f
- https://qiita.com/hisaho/items/7ff94c306db3785f4e68

## 1. AI for Science プロンプトエンジニアリング・ガイド（4cb500...）
### 重要ポイント
- レベル1〜4の段階学習で、単発指示からマルチステップ研究パイプラインまで拡張する設計。
- 良いプロンプトは「タスク」「対象」「範囲/深さ」「出力形式」の4要素を明示する。
- ToolUniverse連携は Sequential Chaining / Broadcasting / Agentic Loops の3パターンで整理されている。
- 科学分析は EDA → 統計検定 → （必要なら）ベイズ推定 の順を推奨。
- 出力は画面表示だけで終わらせず、results/・figures/・report.md へ保存を明示する。

### CoreClaw運用へ反映するルール
- プロンプト作成時に、必ず成果物ファイル名と保存先を指定する。
- 中間チェックポイント（Step 2完了時確認など）をプロンプトに入れる。
- 図表は論文品質要件（英語ラベル、300dpi以上、PNG+SVG/PDF）を標準とする。

## 2. 研究者向け Agent Skills 開発手法（3efbb0...）
### 重要ポイント
- Agent Skills は研究室の手順を再利用可能にする最小単位で、中心は SKILL.md。
- SKILL.md は YAML フロントマター（name, description）+ Markdown 本文（When to Use / Procedure / Code Examples / Caveats）を基本構造とする。
- name は小文字英数字とハイフン、ディレクトリ名一致が推奨。
- 長文化する場合は references/ や scripts/ に分割し、本文を過大化させない。
- まず「日常手順を箇条書き」してから SKILL.md に落とし込むアプローチが有効。

### CoreClaw運用へ反映するルール
- 新規スキル作成時はテンプレート構造（When to Use / Procedure / Output / Caveats）を必須化する。
- スキル追加時は再現性のため、入力・出力ファイルを SKILL.md に必ず明記する。
- 複雑スキルは親スキル + サブスキル構成で管理する。

## 3. SciClaw 実験ノート（9c33c0...）
### 取得状況
- fetch_webpage では本文抽出に失敗。
- 代替で HTML からタイトル・見出し・本文断片を抽出して要点を確認。

### 抽出できた要点
- タイトル: 「SciClaw 実験ノート｜200の科学実験をAIエージェントで自動実行」
- 実験は Phase 1〜6、計200件を実行済みという構成。
- 記事内に「実験構成」「実験一覧」「実験環境」「背景」「プロンプト」「SciClaw の動作」「生成された成果物」「主要知見」の整理軸がある。
- 実験環境例として SciClaw / SATORI / ToolUniverse / GitHub Copilot CLI / Playwright / Docker が示される。

### CoreClaw運用へ反映するルール
- 大規模検証は Phase 分割で設計し、各フェーズで成果物を必ず保存する。
- 検証記事化を前提に、背景・プロンプト・動作・成果物・知見の5点を記録フォーマットとして固定する。

## 4. はじめての CoreClaw（7ff94c...）
### 重要ポイント
- CoreClaw の価値は、コンテナ分離 + Agent Skills プラグイン + MCP 連携の組み合わせ。
- セキュリティは多層防御（コンテナ分離、認証プロキシ、env保護、スキルスキャナー）で運用。
- MCP は ToolUniverse / Deep Research をプリセットで導入可能。
- セットアップは Node.js 22+, Docker, GITHUB_TOKEN が前提。
- 同梱スキル構成と、skills/ 配置による拡張方式が明確。

### CoreClaw運用へ反映するルール
- 起動前チェックに docker info とトークン設定確認を必須化。
- サードパーティスキル導入時はスキャナー実行 + 手動レビューを必須化。
- 実験結果は永続保存される前提で、生成物の人手確認を必ず行う。

## 横断サマリー（今回の重要情報）
- 研究用途では「再現性のあるファイル成果物」が最優先。
- プロンプトは自然言語でも、構造化（Step/入出力/チェックポイント）すると品質が安定する。
- Skill は作ること自体より、運用時の命名規約・出力規約・分割規約が重要。
- CoreClaw は便利さより安全設計（コンテナ分離、認証プロキシ、監査可能性）を軸に運用する。

## 未解決事項
- 9c33c0... 記事は本文完全抽出ができていないため、必要ならブラウザ確認で追補する。
