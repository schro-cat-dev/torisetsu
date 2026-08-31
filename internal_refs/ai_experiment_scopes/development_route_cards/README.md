# Development Route Cards

作成日: 2026-08-31

## 目的

前提知識が少ない人でも、AIを使いながら開発手順を外しにくくし、作業しながら学べる状態を作る。

ここで作るのは教育教材だけではない。開発作業を進めるための型に、必要な学習補助を付ける。

## 課題

熟練者は、作業タイプごとに先に押さえる順番を知っている。

例:

- UI追加なら、利用者行動、state、validation、表示、操作、a11y、E2Eを見る。
- API追加なら、request、response、validation、error、保存、権限、テストを見る。
- DB変更なら、schema、migration、既存データ、rollback、API契約、画面影響を見る。

前提知識が少ない人が、最初からAI任せで短い工期の開発を進めると、次の問題が起きやすい。

- 何を先に決めるべきか分からない。
- AIの提案が正しいか判断できない。
- 動いたように見えて、責務、契約、検証、証跡が抜ける。
- 修正依頼が増え、結果として時間がかかる。
- 高すぎる基準だけを渡すと、使いこなせる人が限られる。

## コア方針

強い制約で人やAIの動きを縛るのではなく、開発作業に型を付ける。

型があると、次の効果が出る。

- 最初に見る場所が分かる。
- AIへ渡す入力がそろう。
- 完了条件が曖昧になりにくい。
- 初心者、中級者、熟練者が同じ品質ゲートで合流できる。
- 補助量だけを変えられる。

品質基準は下げない。ただし、表示する説明量と支援の粒度は利用者に合わせる。

## 用語

| 用語 | 意味 | 具体例 |
|---|---|---|
| route card | 作業タイプごとの進行カード | `UI feature追加`、`API endpoint追加` |
| gate | 通過条件 | `入力validationがある`、`結果証跡がある` |
| support mode | 補助量の切替 | `learner`、`checklist`、`evidence` |
| quality level | 完了水準 | `minimum pass`、`standard`、`expert` |
| route friction | 進めにくさの実測 | 修正回数、詰まり時間、追加指示回数 |

## 作る構造

| 部品 | 役割 | 持つ情報 |
|---|---|---|
| Route Registry | 作業タイプ一覧 | routeId、対象、使う場面、非対象 |
| Route Card | 1作業タイプの手順 | 入力、順序、gate、確認コマンド、証跡 |
| Support Mode | 補助量の切替 | 説明量、例、次の操作、表示する警告 |
| Gate Profile | 品質ゲート | minimum / standard / expert の条件 |
| Friction Log | 詰まりの記録 | 時間、修正回数、追加指示、失敗箇所 |
| Improvement Proposal | 改善案 | route、prompt、gate、docs のどこを直すか |

## support mode

| mode | 対象 | 表示するもの | 表示しすぎないもの |
|---|---|---|---|
| `learner` | 前提知識が少ない人 | 理由、NG例、OK例、次の操作、確認コマンド | 長い背景説明、専門用語だけの説明 |
| `checklist` | 基本手順は分かる人 | gate、入力、出力、確認コマンド、残リスク | 初歩的な理由説明 |
| `evidence` | 熟練者、レビュー担当 | gate結果、差分、実行ログ、未達 | 手順の説明 |

同じrouteでも、modeで変えるのは補助量だけにする。品質ゲートそのものは共通にする。

## quality level

| level | OK条件 | 使う場面 |
|---|---|---|
| `minimum pass` | 壊れていない。引き継げる。検証できる。 | 小さい修正、初回試行 |
| `standard` | 実務で使える。主要な失敗ケースを見ている。 | 通常の開発作業 |
| `expert` | 設計判断、保守性、将来変更、運用リスクまで見ている。 | 重要機能、権限、DB、外部連携 |

`minimum pass` は低品質の許可ではない。最低限、壊れていないこと、引き継げること、検証できることを満たす。

## route card最小形

```json
{
  "schemaVersion": "development-route-card.v1",
  "routeId": "ui.feature.add.v1",
  "title": "UI feature追加",
  "appliesTo": ["new UI behavior", "form", "list", "detail panel"],
  "notAppliesTo": ["database migration", "auth policy change"],
  "requiredInputs": [
    "userGoal",
    "targetScreen",
    "stateChange",
    "validationRules",
    "doneCriteria"
  ],
  "steps": [
    {
      "stepId": "UI-01",
      "name": "利用者行動を決める",
      "gate": "何を押すと何が変わるかが1文で書かれている"
    }
  ],
  "qualityGates": {
    "minimumPass": ["build passes", "main interaction works", "evidence saved"],
    "standard": ["unit or e2e selected", "error state handled", "a11y checked"],
    "expert": ["responsibility boundary checked", "future change risk written"]
  }
}
```

## route card例

### UI feature追加

| 順 | 見ること | gate | learner補助 |
|---:|---|---|---|
| 1 | 利用者行動 | 何を押すと何が変わるかが書かれている | NG: `便利にする` / OK: `保存を押すと一覧に追加される` |
| 2 | state | local state、server state、URL stateを分けている | どこに残る情報かを選ぶ |
| 3 | validation | 必須、任意、文字数、失敗時表示がある | 入力例とエラー例を1つ書く |
| 4 | UI表示 | loading、empty、error、successがある | 画面状態を4つに分ける |
| 5 | 操作確認 | unit、E2E、手動確認のどれで見るか決まっている | コマンドまたは手順を出す |
| 6 | 証跡 | 実行結果と残リスクが残っている | 結果ファイルかログを書く |

### API endpoint追加

| 順 | 見ること | gate | learner補助 |
|---:|---|---|---|
| 1 | request | method、path、body、queryが決まっている | `POST /items` のように書く |
| 2 | response | success、validation error、not found、forbiddenがある | status code例を出す |
| 3 | contract | schemaとfixtureがある | JSON例を1つ書く |
| 4 | 権限 | 誰が呼べるか決まっている | roleごとのOK/NG表を作る |
| 5 | 保存 | DBまたはfileへの影響が分かる | 書き込むfieldを列挙する |
| 6 | 検証 | contract testまたはAPI flowがある | 実行コマンドを出す |

### DB変更

| 順 | 見ること | gate | learner補助 |
|---:|---|---|---|
| 1 | 変更理由 | どの機能のための列/テーブルか分かる | UIやAPIとの関係を書く |
| 2 | schema | 型、必須、default、indexが決まっている | 1行のschema例を出す |
| 3 | migration | 既存データへの影響が書かれている | 追加、変更、削除を分ける |
| 4 | rollback | 戻し方がある | 戻せない場合は理由を書く |
| 5 | contract影響 | API、fixture、画面表示への影響がある | 影響ファイル候補を出す |
| 6 | 検証 | migration確認と既存テストが通る | 実行コマンドを書く |

## モード導入の手順

1. `routeId` を選ぶ。
2. `supportMode` を選ぶ。
3. `qualityLevel` を選ぶ。
4. 必須入力を埋める。
5. route cardの順に作る。
6. gateを通す。
7. friction logを残す。
8. 詰まりが多いrouteは、説明、例、gate、AI promptのどれを直すかproposalを出す。

## 検証方法

最初はTODOアプリで試す。

| 検証 | 内容 | OK条件 |
|---|---|---|
| DRC-EVAL-01 | 同じUI追加を `learner` と `checklist` で実行する | 完了条件は同じで、追加指示回数が記録される |
| DRC-EVAL-02 | API追加routeでfixtureとcontractを作る | route cardのgateが全部埋まる |
| DRC-EVAL-03 | DB変更routeを文書だけで通す | migration、rollback、contract影響が漏れない |
| DRC-EVAL-04 | AIにroute cardを読ませて実装させる | 依頼外スコープ追加、検証抜け、証跡抜けを記録する |

## 測る指標

| 指標 | 意味 | 改善方向 |
|---|---|---|
| `revisionRequestCount` | ユーザーの修正依頼回数 | 減る |
| `blockedMinutes` | 作業が止まった時間 | 減る |
| `aiClarificationCount` | AIからの確認回数 | 必要分だけに減る |
| `gatePassRate` | route gate通過率 | 上がる |
| `humanOnlyFindingCount` | 人間レビューで初めて見つかった不足 | 減る |
| `handoffCompletenessRate` | 非担当者が引き継げる証跡の充足率 | 上がる |

## 完了条件

| ID | 完了条件 | 判定方法 |
|---|---|---|
| DRC-01 | route cardの目的と非ゴールが書かれている | このREADMEに該当節がある |
| DRC-02 | support modeが定義されている | `learner/checklist/evidence` の違いが表で分かる |
| DRC-03 | quality levelが定義されている | `minimum pass/standard/expert` のOK条件がある |
| DRC-04 | route cardのJSON最小形がある | `development-route-card.v1` の例がある |
| DRC-05 | UI/API/DBのroute例がある | 3種類のroute表がある |
| DRC-06 | 検証方法がある | DRC-EVALがある |
| DRC-07 | 実行タスクが分かる | `task_list.md` へリンクされている |

## 参照

- [することリスト](task_list.md)
- [チーム一元化ハーネス](../skill_orchestration_harness/team-centralized-harness-system-design.md)
- [評価と再現性](../evaluation_reproducibility/README.md)
- [ベンチマーク・閾値設計](../benchmark_threshold_design/README.md)
