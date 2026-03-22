---
name: consultant-acn
description: |
  Accenture style consulting skill for deep research and analysis.
  Features DX Strategy Framework, Digital Maturity Assessment, Zero-Based Budgeting (ZBB),
  Cost Excellence, Intelligent Operations, and Value Creation Framework.
  4-phase workflow: Purpose Discovery → Deep Research → Framework Analysis → Report Writing.
  Supports Deep Research MCP for enhanced web research capabilities.
---

# Consultant ACN（アクセンチュア式コンサルティング）

アクセンチュアのメソドロジーを活用した深層リサーチ＆コンサルティング分析スキルです。
DX戦略、コスト変革、オペレーション最適化、価値創造に特化したフレームワークを提供します。

## ワークフロー

```
Phase 1: Purpose Discovery（目的探索）
    ↓ Hypothesis-Driven Approach で課題特定
Phase 2: Deep Research（深層リサーチ）
    ↓ Think→Action→Report サイクル
Phase 3: Framework Analysis（フレームワーク分析）
    ↓ ACN独自フレームワークで構造化分析
Phase 4: Report Writing（レポート生成）
    ↓ アクションプランを含む提言レポート
```

## プロンプト一覧

| プロンプト | フェーズ | 説明 |
|-----------|---------|------|
| **purpose-discovery** | Phase 1 | 仮説駆動で目的探索 |
| **deep-research** | Phase 2 | 反復的深層リサーチ |
| **framework-analysis** | Phase 3 | ACNフレームワーク分析 |
| **report-writing** | Phase 4 | レポート生成 |
| **full-research** | 全フェーズ | 統合リサーチ |

## スキル一覧

| スキル | 説明 |
|--------|------|
| **orchestrator** | タスク分類・フェーズルーティング |
| **framework-library** | ACN固有フレームワーク定義 |

## ACNフレームワーク一覧

### DX戦略

| フレームワーク | 用途 |
|--------------|------|
| **DX Strategy Framework** | デジタル変革の戦略立案（ビジョン→戦略→ロードマップ） |
| **Digital Maturity Assessment** | デジタル成熟度の5段階評価 |
| **Technology Vision** | テクノロジートレンドの分析と事業インパクト評価 |

### コスト変革

| フレームワーク | 用途 |
|--------------|------|
| **Zero-Based Budgeting (ZBB)** | ゼロベースでの予算見直し・コスト最適化 |
| **Cost Excellence** | コスト構造の可視化と最適化施策 |
| **Operational Efficiency** | オペレーション効率化・自動化 |

### オペレーション

| フレームワーク | 用途 |
|--------------|------|
| **Intelligent Operations** | AI/自動化によるオペレーション高度化 |
| **Process Excellence** | 業務プロセスの標準化・最適化 |

### 戦略・価値創造

| フレームワーク | 用途 |
|--------------|------|
| **Hypothesis-Driven Approach** | 仮説駆動型問題解決 |
| **Issue Tree** | MECEなイシュー分解 |
| **Value Creation Framework** | 成長・マージン・資本効率の3軸分析 |
| **Growth Strategy** | 成長戦略の立案・評価 |

### 組織変革

| フレームワーク | 用途 |
|--------------|------|
| **Change Management** | 変革推進のステークホルダー管理 |
| **Talent Strategy** | デジタル人材戦略・リスキリング |

## 使い方

### 例

- 「DX戦略を立案して」→ DX Strategy Framework 適用
- 「コスト削減施策を検討して」→ Zero-Based Budgeting 適用
- 「業務の自動化を検討して」→ Intelligent Operations 適用
- 「新規市場への成長戦略を立案して」→ Growth Strategy 適用

## 品質ゲート

| ゲート | 条件 |
|--------|------|
| 1→2 | 真の目的が定義済、リサーチ計画作成済 |
| 2→3 | 3件以上のソース、信頼度60%以上 |
| 3→4 | 1件以上のフレームワーク適用、数値検証済 |
| 4→完了 | レポート品質チェック通過 |

## MCP連携

`deep-research` MCP サーバーが有効な場合、Phase 2（Deep Research）で MCP の構造化リサーチ
フレームワークを活用してください。MCP が利用できない場合は従来の Think→Action→Report
ワークフローを使用します。
