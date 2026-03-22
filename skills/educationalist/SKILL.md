---
name: teaching-assistant
description: |
  AI assistant skill for educators. Built with reference to the SHIDEN project,
  featuring 10 specialized sub-skills for lesson planning, material creation,
  assessment design, individualized instruction, feedback generation,
  student guidance, and meta-prompt generation. Provides practical educational
  support grounded in 175 education theories and curriculum guidelines.
---

# Teaching Assistant

教育者のための包括的なAIアシスタントスキルパッケージです。

## 機能一覧

### プロンプト（教育コンテンツ生成）

| スキル | 説明 | 主な教育理論 |
|--------|------|-------------|
| **meta-prompt** | メタプロンプト生成（コンテキスト収集） | 構造化された質問設計 |
| **lesson-plan** | Bloom's Taxonomyベースの授業計画 | Bloom's Taxonomy, Gagné's Nine Events |
| **materials** | 教材作成（ワークシート・スライド・クイズ） | Gagné's Nine Events, ARCS Model, UDL |
| **assessment** | 評価設計（ルーブリック・テスト・形成的評価） | Constructive Alignment, Bloom's Taxonomy |
| **individual** | 個別指導計画（学習者プロファイルベース） | ZPD, Differentiated Instruction |
| **feedback** | Growth Mindsetベースのフィードバック | Growth Mindset, Self-Regulated Learning |
| **guidance** | 生活指導案（発達段階考慮） | Erikson, Kohlberg, Piaget, PBIS |

### スキル（内部支援機能）

| スキル | 説明 |
|--------|------|
| **orchestrator** | インテント分析とスキルルーティング |
| **theory-lookup** | 175件の教育理論参照 |
| **context-manager** | スキル間コンテキスト管理 |

## 使い方

ユーザーのリクエストに応じて、orchestrator が適切なスキルを自動選択します。

### 例

- 「中学2年の一次関数の授業計画を作成して」→ lesson-plan
- 「小学3年の理科ワークシートを作って」→ materials
- 「英語のルーブリックを作成して」→ assessment
- 「この生徒に合った指導計画を考えて」→ individual
- 「作文にフィードバックを書いて」→ feedback
- 「不登校傾向の生徒への対応を考えて」→ guidance

## 対応学校種

- 小学校（低学年・高学年）
- 中学校
- 高等学校
- 大学

## 学習指導要領

小中高の教育コンテンツ生成時は、学習指導要領に基づいた内容を生成します。

## データベース

以下のデータベースが `data/` ディレクトリに格納されています：

| ファイル | サイズ | 内容 |
|---------|--------|------|
| `theories.db` | 1.5MB | 175件の教育理論 (SQLite FTS5 trigram) |
| `theories.json` | 315KB | 教育理論 JSON版 |
| `relations.json` | 9.4KB | 理論間の関係データ (77件) |
| `curriculum.db` | 13MB | 学習指導要領 SQLite DB (2657セクション, FTS5 trigram) |

### curriculum.db の使い方

学習指導要領を検索する場合は **必ず `curriculum.db` を使用** してください。
`curriculum/*.md` を grep で検索してはいけません（5.2MB のファイルスキャンは非常に遅いため）。

```sql
-- 3文字以上のキーワード: FTS5検索（高速）
SELECT s.school_level, s.heading, s.body
FROM sections_fts f JOIN sections s ON f.rowid = s.rowid
WHERE sections_fts MATCH 'キーワード（3文字以上）'
LIMIT 10;

-- 2文字のキーワード: LIKE フォールバック
SELECT school_level, heading, body
FROM sections
WHERE (heading LIKE '%キーワード%' OR body LIKE '%キーワード%')
LIMIT 10;

-- 学校種で絞り込み
SELECT school_level, heading, body
FROM sections
WHERE school_level = '小学校'
AND (heading LIKE '%体育%' OR body LIKE '%体育%')
LIMIT 10;
```

**school_level の値**: `小学校`, `中学校`, `高等学校`
