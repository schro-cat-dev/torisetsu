# Local LLM Inference Architecture

作成日: 2026-09-04 JST

## 目的

小型LLM、推論アーキテクチャ、必要リソース、ライセンス、field lineage harness への組み込み方を、開発前に参照できる形で整理する。

## 一言で何をするか

LLMを「全部を正しく判断する本体」として扱わず、構造抽出、候補生成、検証、保存、証跡を分けて、field単位の情報運搬を扱えるハーネス設計へ接続する。

## 適用範囲

| 項目 | 内容 |
|---|---|
| タスク重さ | 重 |
| 対象 | local / self-hosted LLM、open-weight / OSS model、推論アーキテクチャ、field lineage harness |
| 非対象 | 実装、実ベンチ実行、商用法務判断、特定クラウドへの本番deploy |
| 想定読者 | ユーザー、ハーネス開発者、セキュリティ確認者、モデル評価者 |

## 文書一覧と状態

| ID | 文書 | 役割 | 状態 |
|---|---|---|---|
| A | [A-goal-scope.md](A-goal-scope.md) | ゴール、スコープ、非ゴール | 作成済み |
| B | [B-quality-checklist.md](B-quality-checklist.md) | 品質観点、完了条件、残リスク | 作成済み |
| C1 | [C1-interface-contract.md](C1-interface-contract.md) | 入出力契約、保存単位、失敗時の扱い | 作成済み |
| C2 | [C2-internal-responsibilities.md](C2-internal-responsibilities.md) | 推論アーキテクチャ別の責務分離 | 作成済み |
| C3 | [C3-step-data-model-design.md](C3-step-data-model-design.md) | 評価ステップ、データモデル、サンプル | 作成済み |
| D | [D-stakeholder-formats.md](D-stakeholder-formats.md) | 読者別の見る場所、判断材料 | 作成済み |
| E | [E-research-log.md](E-research-log.md) | 調査元、確認事実、信頼性 | 作成済み |
| F | [F-alignment-pdca.md](F-alignment-pdca.md) | 認識ずれ、修正方針、PDCA | 作成済み |

## トレーサビリティ表

| 要求ID | ユーザー要求 | 反映先 | 判定 |
|---|---|---|---|
| R1 | モデルサイズの単位が分からない | A, C3 | 反映済み |
| R2 | 動かすリソース感を知りたい | C3, E | 反映済み |
| R3 | 種類と性能アウトプットを知りたい | C2, C3 | 反映済み |
| R4 | 推論アーキテクチャと特徴を知りたい | C2 | 反映済み |
| R5 | 情報の推論・扱いを知りたい | C1, C2, C3 | 反映済み |
| R6 | field lineage harness に組み込みたい | C1, C3 | 反映済み |
| R7 | ライセンスと危険性を見たい | B, E | 反映済み |
| R8 | skillの型で粒度を担保したい | A-D, E | 反映済み |
| R9 | 判断を急がず、情報を細分化し、context/outputを最小化して性能十分性を検証したい | A, B, C1, C3, F | 反映済み |
| R10 | 他のモデルも比較対象にしたい | C3, E | 反映済み |

## 完了確認

| 確認 | 方法 | 結果 |
|---|---|---|
| 起点文書から辿れる | 親READMEへリンク追加 | 実施 |
| 調査元が分かる | EにURLと確認事実を記録 | 実施 |
| JSON例が構文として読める | `jq` でC1/C3のJSON blocksを確認 | 成功 |
| git管理対象 | `git status --short` で確認 | 新規文書セットをcommit対象に含める |
