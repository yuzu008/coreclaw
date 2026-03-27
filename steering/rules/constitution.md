# Constitutional Rules (CoreClaw)

CoreClaw の変更は、以下の条項に従う。

## I. Reproducibility-First
すべての実験は再現可能でなければならない。
プロンプト、入力、設定、出力、実行環境を記録する。

## II. Run-Centric Interface
管理単位はチャットではなく Experiment Run とする。

## III. Test-First Discipline
変更はテストで期待動作を先に定義してから実装する。

## IV. Requirements Clarity
要件は曖昧語を避け、検証可能な形式で記述する。

## V. Full Traceability
要件 → 設計 → 実装 → テスト → 成果物の追跡可能性を維持する。

## VI. Project Memory
判断前に `steering/` を参照し、方針との整合を確認する。

## VII. Pattern Consistency
既存設計パターンに整合する実装を優先する。

## VIII. Decision Records
重要な技術判断はドキュメント化して履歴に残す。

## IX. Quality Gates
typecheck / lint / test を通過しない変更は統合しない。
