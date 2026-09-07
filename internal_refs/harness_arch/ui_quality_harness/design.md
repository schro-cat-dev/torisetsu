# UI品質ハーネス設計

作成日: 2026-09-07

## 結論

UI品質ハーネスは、次の分離で作る。

```text
docs
  何を良いUIと見るかを書く

profile / policy / scenario / contract
  画面、情報、配置、フロー、状態、しきい値、判断項目を書く

runner
  入力を読み、検証し、adapterを呼び、結果JSONを出す

adapter
  Playwright、axe、ARIA snapshot、DOM検査、screenshot比較など外部tool差分を吸収する

result
  実行結果、失敗箇所、未自動化項目、証跡を書く
```

## 非ゴール

- runner本体へ個別画面名、文言、path、しきい値を直書きしない。
- UIの良し悪しをすべて完全自動判定しない。
- 共通engineへPlaywright、axe、対象アプリの依存を持ち込まない。外部toolはadapter configから呼ぶ。

## 品質観点

| gate | 見ること | 自動化 |
|---|---|---|
| `purposeAndTaskFit` | 利用者の目的に合うか | `judgment` |
| `informationContent` | 必要な情報が載っているか | `auto` |
| `informationDensity` | 情報量が多すぎない/少なすぎないか | `semi_auto` |
| `informationArchitecture` | 主情報、補足情報、操作情報の関係が正しいか | `semi_auto` |
| `placementAndProximity` | 関係する情報と操作が近いか | `semi_auto` |
| `interactionFlow` | 実際に触ったときの流れが成立するか | `auto` |
| `interactionPattern` | button、form、dialogなどが期待どおり動くか | `auto` |
| `stateAndRecovery` | loading、empty、error、success、disabled、retry、cancelがあるか | `auto` |
| `baseAccessibility` | label、keyboard、focus、ARIA、contrastが成立するか | `auto` |
| `layoutConsistency` | viewportが変わっても配置、余白、横幅が崩れないか | `auto` |
| `componentConsistency` | 同じ役割のUIが同じ見た目・文言・動きか | `semi_auto` |
| `domainSpecificTaste` | 業務らしさ、ブランド感、固有の味があるか | `judgment` |

## module分離

| module | 責務 | 持たないもの |
|---|---|---|
| `profile loader` | JSONを読み内部表現へそろえる | 個別画面の判断 |
| `contract validator` | 必須field、ID重複、参照整合性を見る | ブラウザ操作 |
| `tool adapter` | Playwright/axeなどの差分を吸収する | gate定義の意味 |
| `orchestrator` | 全sourceを実行しrule、scenario、gateへ集約する | 対象固有path、ID、しきい値 |
| `result writer` | 結果JSONを同じ形で保存する | 判断文の創作 |
| `judgment review` | 自動化できない項目の判断を記録する | DOM検査の代替 |

## 実装済みadapter

| adapter | 入力 | 出力 | 見ること |
|---|---|---|---|
| DOM snapshot | profile + `ui-dom-snapshot.v2` | `ui-quality-adapter-result.v1` | 必須情報、不要情報、表示文字量、DOM/視覚順、距離、同一役割pattern |
| judgment review | profile + `ui-judgment-review.v1` | `ui-quality-adapter-result.v1` | rubric参照、判断根拠、必要証跡、未確認点 |
| command status | profile + adapter command結果 | `ui-quality-adapter-result.v1` | browser、axe、layout、visualの成功、失敗、timeout、依存失敗 |

## adapter契約

adapter configは、外部toolとのつなぎ方だけを書く。

| field | 内容 |
|---|---|
| `adapterId` | adapterの識別子 |
| `adapterKind` | browser-flow、accessibility-auditなどの役割 |
| `capabilities` | できる検査 |
| `execution` | 実行方法。command、引数、timeoutはconfig側に置く |
| `inputContract` | profileから何を受け取るか |
| `outputContract` | どんな結果を返すか |

runnerはadapter configを読むが、特定toolの実装詳細は知らない。

## profileに置くもの

- 対象UIのID。
- gate一覧。
- evidence source一覧。
- rule一覧。
- scenario一覧。
- judgment review rubric。
- しきい値。

## runnerに置いてよい固定値

- `ui-quality-harness-profile.v1`
- `ui-quality-harness-result.v1`
- 許可する `checkKind`: `auto`、`semi_auto`、`judgment`
- 許可する `severity`: `error`、`warning`、`review`
- 結果status: `ok`、`failed`

## runnerに置かない固定値

- 対象画面名。
- URL、port、path。
- 必須表示項目。
- 最大文字数。
- 操作手順。
- 使用する外部toolのpath。
- 業務固有の言い回し。

## 完了条件

- profile JSONを追加すれば、新しい画面をrunner変更なしで検査できる。
- 参照切れ、ID重複、不正な分類を検出できる。
- 実行結果がJSONで残る。
- 自動化できない項目は `judgment` として明示される。
- `configRef` の参照切れを検出できる。
- 証跡欠落、skip、scenario未実行、blocking warningを最終成功にしない。
- 新しい対象はprofile、policy、scenario、adapter config、必要なbaseline追加で接続し、共通engineを変更しない。
