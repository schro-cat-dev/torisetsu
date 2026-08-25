# テスト追跡とJSON実行runner設計

## 結論

- 実現可能。
- このPoCでは、要件の出どころ、JSON spec、tester moduleを分ける。
- 最初に構造の整合性を確認し、その後で個別テストを実行する。

## 前回のすることリストの意味

| したこと | 意味 | ユーザー依頼との対応 |
|---|---|---|
| 設計判断を明文化 | `_` 命名、DCE、DI、言語差分を設計として分ける | 開発用メソッドを本番へ混ぜない方法の確認 |
| 要件とテストの1対1対応 | 要件元とJSON specを `theme` で一致させる | issueまたはmdとテストを対応させたい |
| moduleとJSON specを分離 | 実行方法はmodule、個別条件はJSONへ置く | 同じ実行moduleを他用途でも使いたい |
| `npm run check` に組み込み | 通常品質確認で構造ズレも検出する | 品質ハーネスの一部として管理したい |
| 言語別の本番切り離しは設計化 | Go/TS/JS/Pythonで現実解が違うため、先に判断表にした | TS/JSのAST削除まで今すぐ入れると重い |

不足していた点:

- 前回は `md` 固定に見える設計だった。
- `issue` 連携先を同じ形で扱う抽象化が足りなかった。
- `テストspec` という用語の説明が足りなかった。

## ファイル構成

```text
test_management/
  manifest.json
  issues/
    <theme>.json
  requirements/
    <theme>.md
  specs/
    <theme>.json

tooling/quality-harness/
  checks/check-test-traceability.mjs
  test-runner/tester-modules/
    file-contains.mjs
    json-field-equals.mjs
```

## 基本ルール

| ルール | 内容 |
|---|---|
| source adapter | 要件の出どころを `md`、`issue-file` などに分ける |
| theme一致 | `manifest.json` の `theme` と source/spec の名前を一致させる |
| 1対1 | 1つの要件元に、1つのJSON specだけを対応させる |
| 野良禁止 | manifestにない source/spec があれば失敗 |
| link確認 | spec内の `links[].path` が存在しなければ失敗 |
| 実行分離 | tester moduleは実行方法だけを持ち、個別条件はJSONに置く |
| 配置分離 | `specDir` と `testerModuleDir` は runner ではなく `manifest.json` に置く |

## 用語

| 用語 | シンプルな意味 | 具体例 |
|---|---|---|
| `manifest` | 全体リスト | `test_management/manifest.json` |
| `requirement source` | 要件の置き場所 | `requirements/*.md`、`issues/*.json` |
| `source adapter` | 要件の置き場所ごとの読み方 | `md`、`issue-file` |
| `test spec` | テストmoduleへ渡すJSONの指示書 | `specs/artifact-version-contract.json` |
| `tester module` | 同じ型のテストを実行するコード | `json-field-equals.mjs` |
| `result JSON` | 詳細な実行結果 | `test-traceability.results.json` |

`test spec` と言った場合、このPoCでは `test_management/specs/*.json` を指す。
例: `artifact-version-contract.json` は、`json-field-equals.mjs` に `package.json.version は 0.5.0` という条件を渡す。

## 実行順

1. `test_management/manifest.json` を読む。
2. `requirementSources` を読む。
3. `requirements/<theme>.md` または `issues/<theme>.json` が全件あるか確認する。
4. `specs/<theme>.json` が全件あるか確認する。
5. manifestにない余計な source/spec がないか確認する。
6. spec内の `requirementRef` と `links` を確認する。
7. `tester` に対応する module を `manifest.testerModuleDir` から読み込む。
8. JSONの `input` を渡してテストを実行する。

## source adapter

| type | 実体 | 今の状態 | 将来の拡張 |
|---|---|---|---|
| `md` | `test_management/requirements/<theme>.md` | 実装済み | ローカル設計書、手書き要件 |
| `issue-file` | `test_management/issues/<theme>.json` | 実装済み | GitHub Issueなどの取得結果を保存 |
| `github-issue-fixture` | `test_management/github_issues/<theme>.json` | 実装済み | GitHub Issue APIの取得結果を保存 |
| `github-issue` | GitHub API | 未実装 | API取得、認証、キャッシュが必要 |

今は外部APIへ接続しない。
理由は、このリポジトリのPoCでは、まずローカルで再現できる構造チェックを優先するため。

## spec契約

```json
{
  "schemaVersion": "test-spec.v1",
  "theme": "quality-harness-profile-split",
  "requirementRef": {
    "sourceId": "local-md",
    "key": "quality-harness-profile-split"
  },
  "tester": "file-contains",
  "links": [
    {
      "type": "implementation",
      "path": "tooling/quality-harness/run-quality-harness.mjs"
    }
  ],
  "input": {}
}
```

## tester module

| module | 役割 |
|---|---|
| `file-contains.mjs` | 指定ファイルに指定文字列があるか確認する |
| `json-field-equals.mjs` | JSON内の指定pathが期待値と一致するか確認する |

## 汎用性の判断

| 追加したいもの | engine変更 |
|---|---|
| 新しいmd要件 | 不要。md/json/manifestを足す |
| 新しいissue-file要件 | 不要。issue json/spec/manifestを足す |
| 同じ種類のテスト条件 | 不要。JSONを足す |
| 新しい種類の判定 | 必要。tester moduleを1つ足す |
| 新しいsource type | 必要。source adapterを1つ足す |
| manifestのschema変更 | 必要。互換性判断が必要 |

この分離により、個別テストの増加では runner 本体を変えない。

## このPoCの対象

| theme | tester | 見ること |
|---|---|---|
| `quality-harness-profile-split` | `file-contains` | profile分離がpackageとdocに反映されているか |
| `artifact-version-contract` | `json-field-equals` | packageとlockfileのversionが現在版か |
| `traceability-source-adapter` | `file-contains` | mdとissue-fileのsource adapterがmanifestにあるか |
| `github-issue-fixture-adapter` | `file-contains` | GitHub Issue相当のfixtureをsourceにできるか |

## summaryに詳細レポートを出していない理由

判断理由:

- `summary.md` は品質ハーネス全体の入口で、check単位のOK/NGを短く見る用途。
- 個別caseやassertionの詳細は、各checkのlogに出す方が、summaryが膨らまない。
- まずは「構造が通ったか」を確認する段階なので、詳細レポート生成は別責務に分けた。

今の出力先:

- 概要: `harness_runs/<runId>/summary.md`
- 詳細: `harness_runs/<runId>/test-traceability.log`

次に必要なら:

実装済み:

- `check-test-traceability.mjs` は case別の `test-traceability.results.json` を出す。
- `summary.md` は概要だけを出す。

未実装:

- `run-quality-harness.mjs` は result JSON の中身までは集約していない。
- `summary.md` に case数、assertion数、失敗caseはまだ出していない。

## 残リスク

- GitHub Issue APIとはまだ直接連携していない。
- traceability用の実ブラウザ操作JSON specは未作成。PlaywrightのE2E tool specは `external-tools/playwright/*.tool.json` として作成済み。
- テスト結果の詳細レポートは、summaryではなく `test-traceability.results.json` に出している。
