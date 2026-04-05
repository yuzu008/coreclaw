# K-Dense Skill 取り込み計画（Batch A）

最終更新: 2026-04-02
対象: CoreClaw v0.1.35+

## 1. 目的

CoreClaw の既存 scientist スキル群を活かしつつ、K-Dense 側の実装資産が厚いスキルを限定導入して、以下を改善する。

- データベース横断検索の再現性
- 初見データ解析の標準化
- 引用管理の正確性

## 2. Batch A 導入対象

1. database-lookup
- 取得元: scientific-skills/database-lookup
- 配置先: skills/scientist/scientific-database-lookup
- 主効果: 78 DB 横断検索、ID 変換、API キーとレート制限の運用ガイド

2. exploratory-data-analysis
- 取得元: scientific-skills/exploratory-data-analysis
- 配置先: skills/scientist/scientific-exploratory-data-analysis
- 主効果: 200+ 形式の EDA 初動と markdown レポート標準化

3. citation-management
- 取得元: scientific-skills/citation-management
- 配置先: skills/scientist/scientific-citation-management
- 主効果: DOI/PMID/arXiv から BibTeX 生成・整形・検証の一気通貫化

## 3. 導入前チェック（必須）

1. ライセンス確認
- 各 SKILL.md の frontmatter にある license を確認し、記録する。
- Batch A の 3 スキルは MIT 系であることを確認済み。

2. セキュリティ確認
- cisco-ai-skill-scanner を実行する。
- 実行例:

```bash
uv pip install cisco-ai-skill-scanner
skill-scanner scan /path/to/scientific-database-lookup --use-behavioral
skill-scanner scan /path/to/scientific-exploratory-data-analysis --use-behavioral
skill-scanner scan /path/to/scientific-citation-management --use-behavioral
```

3. 重複ポリシー確認
- 既存の近縁スキルとの役割分担を明文化する。
- 既存候補:
  - scientific-data-profiling
  - scientific-literature-search
  - scientific-citation-checker

## 4. 取り込み手順

実施状況（2026-04-02）
- 完了: 3 スキルの実ファイル取り込み
  - skills/scientist/scientific-database-lookup
  - skills/scientist/scientific-exploratory-data-analysis
  - skills/scientist/scientific-citation-management
- 完了: skill-scanner 実行結果の記録
  - 記録先: docs/kdense-skill-scanner-2026-04-02.md
  - scientific-database-lookup: CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 1 / INFO 1
  - scientific-exploratory-data-analysis: CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 0 / INFO 0
  - scientific-citation-management: CRITICAL 4 / HIGH 0 / MEDIUM 6 / LOW 1 / INFO 0
- 完了: API smoke 検証ログ（投入確認）
  - 記録先: docs/kdense-batch-a-api-smoke-2026-04-02.md
  - 補足: headless mode のため、実応答評価は未実施
- 未完了: UI/接続チャネル上での smoke prompt 実応答検証
- 判定: 受け入れ基準「Critical が 0」を満たさないため、scientific-citation-management は有効化保留
- smoke prompt 定義: docs/demo-prompts.md の「9. K-Dense Batch A Smoke Prompt（導入検証）」

1. ディレクトリを作成

```bash
mkdir -p skills/scientist/scientific-database-lookup
mkdir -p skills/scientist/scientific-exploratory-data-analysis
mkdir -p skills/scientist/scientific-citation-management
```

2. 元リポジトリから内容をコピー
- SKILL.md
- references/
- scripts/
- assets/

3. CoreClaw 命名規約へ調整
- ディレクトリ名は scientific- プレフィックスで統一。
- SKILL.md の name は upstream 名を保持し、description は日本語追記してもよい。

4. 依存パッケージの整理
- scripts で必要な Python パッケージを抽出して、依存管理方針を決定する。
- 研究実行環境に固定バージョンを残す。

## 5. 受け入れ基準

1. discovery
- 3 スキルが CoreClaw のスキル探索で認識される。

2. smoke prompt
- database-lookup:
  - 「KRAS と膵がん予後の公開 DB 情報を集約」
- exploratory-data-analysis:
  - 「手元 CSV の構造と品質を分析して markdown で報告」
- citation-management:
  - 「DOI リストから BibTeX を作成し重複検出」

3. 安全性
- skill-scanner で Critical が 0。

4. トレーサビリティ
- 導入したスキル名、版、導入日、担当者を docs に記録。

## 6. ロールバック手順

1. 追加した 3 ディレクトリを退避
2. スキルキャッシュを再初期化
3. smoke prompt を再実行して既存挙動に戻ったことを確認

## 7. 次バッチ判定条件

以下を満たしたら Batch B（venue-templates, markitdown, paper-lookup）へ進む。

1. Batch A の smoke prompt 成功率が 90% 以上
2. 運用 1 週間で重大エラー 0
3. 研究者デモで「再現性・引用正確性」が改善した定性的評価を取得
