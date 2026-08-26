# Alignment Gap Review Traceability Tool 詳細設計ドラフト

## 1. 結論

`alignment-gap-review` は、`X1-Y1` のようなデータ型定義モデル参照と、さらに上位の設計スコープをつなげて確認する。

目的は、情報がズレたり、勝手に消えたり、別の観点にすり替わったりすることを防ぎつつ、作業者がストレスなく確認できる状態にすること。

## 2. これは何か

設計、実装、テスト、修正をIDで辿る `design_traceability_framework` に、期待ズレ確認の観点を重ねるための詳細設計。

ここでは、次を同時に見る。

- 上位スコープ。
- 処理フロー。
- `X1-Y1` 形式のデータ型定義モデル参照。
- 複数観点のチェック項目。
- チェック済み、未確認、ズレありの状態。
- どの情報がどこへつながっているか。

## 3. 非ゴール

- まだ実装スクリプトは作らない。
- まだサンプルJSONやrunnerは作らない。
- まだ何も実行しない。
- ユーザーがこの詳細設計を確認し、OKを出すまで次の成果物を作らない。
- まだ active skill は増やさない。
- 検索インデックスは作らない。
- Codex / Claude の内蔵 planning へ直接つながない。
- 人間の違和感を、機械が直接検出できるものとして扱わない。

## 4. 解きたい問題

| 問題 | 困ること | この設計で見ること |
|---|---|---|
| 情報が消える | 前に決めた設計判断が後工程で抜ける | 上位スコープから `X1-Y1` まで参照を持つ |
| 情報がズレる | 同じ言葉でも見ている空間が違う | 観点ズレとして明示する |
| 確認が粗い | できているかが感覚になる | 観点ごとにチェック項目を持つ |
| 作業が重い | 確認が面倒で使われない | 必須確認と詳細確認を分ける |
| AIが勝手に広げる | 低確度な情報が混ざる | 対象IDと対象観点を固定する |

## 5. 階層

この設計では、3階層で見る。

| 階層 | 役割 | 例 |
|---|---|---|
| 第0階層 | 上位スコープ | `S1: TODO作成機能` |
| 第1階層 | 処理フロー | `F1: create-todo` |
| 第2階層 | データ型定義モデル参照 | `X1-Y1-Y2: validator前の入力` |

`X1-Y1` は、実行経路IDではない。

これはデータ型定義モデルの参照番号として扱う。

## 6. alignment-gap-review とつなぐ観点

確認順は次にする。

| 順 | 観点 | 確認すること |
|---:|---|---|
| 1 | 提供価値ズレ | 誰に何の価値を出すかが上位スコープと合うか |
| 2 | 目的ズレ | そのIDの目的が処理フローと合うか |
| 3 | 対象ズレ | 確認対象のscope、flow、typeModelRefが合うか |
| 4 | 前提ズレ | API、DB、権限、保存先などの前提が合うか |
| 5 | 粒度ズレ | 確認の細かさが粗すぎないか、細かすぎないか |
| 6 | 要素ズレ | 必要な部品が抜けていないか |
| 7 | 観点ズレ | 同じ情報を、どの空間で見ているかが合うか |
| 8 | 手順ズレ | 設計、実装、検証、pushの順が飛んでいないか |
| 9 | 権限ズレ | 触ってよい範囲、見てよい情報が合うか |
| 10 | 完了条件ズレ | 何ができたらOKかが合うか |

## 7. 観点ズレの扱い

観点ズレでは、ユーザーの言い回しに寄せて `概念とか、情報とかを扱う空間が違う` ケースを明示する。

例:

| 同じ言葉 | AIが見ている空間 | ユーザーが見ている空間 |
|---|---|---|
| `ユーザー情報` | DB列、schema、型 | 権限、監査、個人情報、画面、運用、削除影響 |
| `TODO作成` | POST APIと保存処理 | 利用者価値、UI、状態、API、保存、失敗時UX |
| `チェック済み` | テストが通った状態 | 目的、対象、観点、完了条件まで確認済みの状態 |

このズレを消すには、同じ単語を使っていても、どの情報空間で見ているかをセットで持つ。

## 8. データ構造案

最小の正本はJSONを想定する。

```json
{
  "schemaVersion": "alignment-gap-traceability-map.v1",
  "scopes": [
    {
      "scopeId": "S1",
      "name": "todo-create-feature",
      "providedValue": "ユーザーが迷わずTODOを作成できる",
      "flowIds": ["F1"]
    }
  ],
  "flows": [
    {
      "flowId": "F1",
      "name": "create-todo",
      "scopeId": "S1",
      "typeModelRefs": ["X1-Y1", "X1-Y1-Y2"]
    }
  ],
  "typeModels": [
    {
      "ref": "X1-Y1-Y2",
      "flowId": "F1",
      "name": "CreateTodoRawInput",
      "informationSpace": "validation-input",
      "schema": "contracts/X1-Y1-Y2.create-todo-raw-input.schema.json"
    }
  ],
  "alignmentChecks": [
    {
      "checkId": "AG-F1-X1-Y1-Y2-001",
      "target": {
        "scopeId": "S1",
        "flowId": "F1",
        "typeModelRef": "X1-Y1-Y2"
      },
      "viewpoint": "要素ズレ",
      "required": true,
      "question": "空title、長すぎるtitle、保存できない入力を要素として見ているか",
      "status": "unchecked"
    }
  ]
}
```

## 9. 状態

チェック状態は、最初は少なくする。

| status | 意味 |
|---|---|
| `unchecked` | まだ見ていない |
| `ok` | 確認済み |
| `gap` | ズレあり |
| `blocked` | 判断材料が足りない |
| `not-applicable` | 今回は対象外 |

## 10. 具体例

TODO作成の `X1-Y1-Y2` を見る。

対象:

```text
scopeId: S1
flowId: F1
typeModelRef: X1-Y1-Y2
```

確認:

| 観点 | 質問 | OK条件 |
|---|---|---|
| 提供価値ズレ | TODOを迷わず作成できる価値に関係しているか | 入力失敗時の扱いまで含める |
| 目的ズレ | validator前入力を確認しているか | core後のTODOではなくraw inputを見る |
| 要素ズレ | 空title、長すぎるtitle、未入力項目を見ているか | 入力失敗パターンが列挙されている |
| 観点ズレ | API入力だけでなくUX、保存、検証の空間も見ているか | どの空間で見るかが明示されている |
| 完了条件ズレ | 何ができたら確認済みか | schema、test、エラー表示方針がある |

## 11. ツール化する場合の構成

まだ実装しないが、作るなら次の分離にする。

```text
tooling/alignment-gap-trace/
  runners/
    check-alignment-gap-map.mjs
    check-alignment-targets.mjs
  maps/
    alignment-gap-traceability-map.json
  reports/
    alignment-gap-report.json
```

| 部品 | 役割 |
|---|---|
| runner | JSONを読み、ID重複、参照切れ、未確認、ズレを検出する |
| map | scope、flow、typeModelRef、alignmentChecksの正本 |
| report | 実行結果。OK、gap、blocked、未確認件数を出す |

## 12. 最初に機械で確認すること

| 確認 | OK条件 |
|---|---|
| scope参照 | `flows[].scopeId` が `scopes[].scopeId` に存在する |
| flow参照 | `typeModels[].flowId` が `flows[].flowId` に存在する |
| typeModel参照 | `alignmentChecks[].target.typeModelRef` が `typeModels[].ref` に存在する |
| 観点 | `viewpoint` が許可リストに含まれる |
| 状態 | `status` が許可リストに含まれる |
| 必須未確認 | `required: true` で `unchecked` が残っていれば警告 |
| 情報消失 | scope、flow、typeModelRefに紐づくcheckが0件なら警告 |

## 13. 人間に出すレポート

```text
結論:
追加確認が必要。

対象:
- S1 / F1 / X1-Y1-Y2

未確認:
- AG-F1-X1-Y1-Y2-001: 要素ズレ
- AG-F1-X1-Y1-Y2-002: 観点ズレ

ズレ:
- なし

次の一手:
X1-Y1-Y2 の入力失敗パターンを列挙し、schemaとtestに接続する。
```

## 14. 受け入れ条件

詳細設計レビューの完了条件:

- [ ] 上位スコープ、flow、typeModelRefの関係が分かる。
- [ ] `alignment-gap-review` の10観点をどう接続するか分かる。
- [ ] 観点ズレとして、概念や情報を扱う空間が違うケースを説明できている。
- [ ] status、check、reportの最小構造が分かる。
- [ ] まだ作らないものが明示されている。
- [ ] ユーザーが修正を入れられる粒度になっている。

ユーザーOK後の最小PoC完了条件:

- [ ] 上位スコープ、flow、typeModelRefを1つのJSONで参照できる。
- [ ] `alignment-gap-review` の10観点をcheckとして持てる。
- [ ] 未確認、ズレあり、blockedを分けられる。
- [ ] 必須checkの未確認を検出できる。
- [ ] ID参照切れを検出できる。
- [ ] reportをJSONと人間向けsummaryで出せる。

## 15. 次の一手

優先度とおすすめ度は5が高い。ここでの優先度は `設計情報を消さず、ズレを早く見つけ、ツール化できるか` の視点で見る。

| 次の作業 | 優先度 | おすすめ度 | 背景 |
|---|---:|---:|---|
| サンプルJSONを作る | 5 | 5 | 実際に構造が耐えるか確認するため |
| 最小runnerを作る | 5 | 5 | ID参照切れと未確認を機械で見るため |
| report形式を作る | 4 | 5 | 人間がストレスなく確認するため |
| 既存 `todo-id-correspondence-map.json` と接続する | 4 | 4 | X1-Y1資産を再利用するため |
| active skill化 | 2 | 2 | まだ早い。ツール化の形を見てからでよい |

上の作業は、ユーザーがこの詳細設計にOKを出してから行う。
