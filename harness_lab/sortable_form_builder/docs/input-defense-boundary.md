# JSON入力の防御境界

## 結論

`@torisetsu/configurable-list-core`は、外部から来た構成JSONをアプリ内部へ渡す前に検査する共通moduleを持つ。Reactには依存せず、ブラウザ、Node API、worker、file loaderから同じ関数を使える。

これは認証、権限、PII削除、SQL対策をまとめた万能security moduleではない。担当範囲は、JSONとしての安全な読取と、configurable list固有契約の検証、Markdown表示前の無害化です。

## 処理順と責務

```text
外部入力 unknown
  -> filterJsonInputAtBoundary       JSON共通防御
  -> filterItemCompositionConfig     item構成固有の契約
     または filterDetailLayoutConfig detail表示固有の契約
  -> 正規化済みvalue
  -> 保存、処理、React描画
```

| module | 入力 | 成功時 | 失敗時 |
|---|---|---|---|
| `filterJsonInputAtBoundary` | JSON文字列、JSON code fence、plain object | clone済みJSON値と計測値 | `code / path / message` |
| `filterDetailLayoutConfig` | 詳細表示config | 正規化済みlayout、Markdown除去記録 | layout全体を拒否 |
| `filterItemCompositionConfig` | field・表示構成config | 正規化済み構成、内包Markdownの除去記録 | 構成全体を拒否 |
| `createInputBoundaryAdapter` | 上記filter | `require()`で正規化済みvalue | issues付き`InputBoundaryRejectedError` |

## 共通防御

- JSON文書の最大文字数を確認する。
- object入力でも、最大ネスト、最大要素数、文字列合計を確認する。
- `__proto__`、`prototype`、`constructor`を拒否する。
- 循環参照、関数、`undefined`、`NaN`、class instance、accessor、Symbol property、欠けたarrayを拒否する。
- JSON変換時に消えるarrayの追加propertyを拒否する。
- policyの上限値が0、負数、非整数なら、入力処理を始めず拒否する。
- 成功時は元objectをそのまま返さず、検査後にcloneした値を返す。

既定値:

| 契約 | 文書文字数 | ネスト | 要素数 | JSON内文字列合計 |
|---|---:|---:|---:|---:|
| detail layout | 64,000 | 8 | 2,048 | 64,000 |
| item composition | 128,000 | 8 | 4,096 | 128,000 |

個別上限は`contracts/*.policy.json`に置く。新しい対象固有の値を共通JSON境界へ直書きしない。

## Node APIでの使用例

API frameworkはpackageの責務に含めない。handlerは保存処理より前にfilter結果を確認する。

```ts
import { filterItemCompositionConfig } from "@torisetsu/configurable-list-core";

const result = filterItemCompositionConfig(request.body);
if (!result.ok) {
  return response.status(400).json({ issues: result.issues });
}

await repository.save(result.value);
```

例外で処理を止めるworkerやfile loaderではadapterを使う。

```ts
import {
  createInputBoundaryAdapter,
  filterItemCompositionConfig,
} from "@torisetsu/configurable-list-core";

const boundary = createInputBoundaryAdapter(filterItemCompositionConfig);
const safeComposition = boundary.require(receivedPayload);
await applyComposition(safeComposition);
```

`require()`は成功時の`value`だけを返す。除去記録も保存する処理では、adapterではなくfilter結果の`sanitizationChanges`を読む。

## 迂回防止

- React packageが公開する詳細rendererは`DetailLayoutRenderer`だけです。
- 検証済み値専用の`ValidatedDetailLayoutRenderer`はpackage内部でのみ使う。
- TypeScript型だけを安全根拠にせず、公開rendererと公開`InlineItemDetails`は実行時にもguardを通す。
- MarkdownはASTでraw HTML、画像、危険linkを除去し、React描画時にも要素とURLをallowlist確認する。
- policyを注入しても、`javascript`など既定の安全protocol外は許可できない。

## 変更前と変更後

| 未完成だった点 | 変更後 | 確認方法 |
|---|---|---|
| JSON parseと危険property確認が2実装 | `input-boundary/`へ統一 | 新しいconfigでも共通関数を使う |
| item compositionへpolicyを渡せない | 第2引数で注入可能 | `maxNestingDepth: 1`で拒否 |
| object入力に総量制限がない | 要素数と文字列合計を制限 | 上限超過objectを拒否 |
| item compositionにネスト制限がない | 共通境界で確認 | `nesting_too_deep`を返す |
| guard済みrendererが公開されていた | 公開indexから削除 | packed packageのexport確認 |
| 公開`InlineItemDetails`から内部rendererへ直接渡せた | `layout`を`unknown`で受け、明示的な`null`を含め必ずguardへ渡す | 不正typeと`null`のcomponent test |
| Node/API接続方法が未定義 | framework非依存adapterと例を追加 | packed coreをNodeで実行 |
| 単体テストがGit追跡外 | 既存testを`tracked-tests/`へ移し、防御testをpackage配下へ追加 | `npm test` |
| workspace testが前回の`dist`を読む可能性があった | `npm test`の先頭でpackageをbuild | source変更後のRed/Green確認 |

## 検証

```bash
npm run test:unit:local
npm run typecheck
npm run build
npm run verify:package
```

`verify:package`はtarballを一時consumerへ展開し、ブラウザbuildに加えてNodeからcoreをimportする。危険Markdownの除去記録と、迂回rendererがexportされていないことも確認する。

既存のUI・回帰テストは`tracked-tests/`、package境界固有のテストは`packages/*/tests/`に置く。どちらもGitのignore対象外です。

### 2026-09-07 実行結果

証跡レベルはL3です。単体の境界値に加え、実際に梱包したpackageを別consumerとNode processから確認した。

| 段階 | commandまたは方法 | 実結果 |
|---|---|---|
| Red 1 | 新しい共通境界・item policy・除去記録の7テスト | 未実装理由で7件失敗 |
| Red 2 | 非公開にするrendererのexportテスト | 公開中のため1件失敗 |
| Red 3 | 危険policy・array追加propertyの3テスト | 防御不足理由で3件失敗 |
| Red 4 | 公開`InlineItemDetails`へ不正typeを渡すtest | 内部rendererへ直行し例外になった |
| Red 5 | 公開`InlineItemDetails`へ`null`を渡すtest | 未指定扱いとなりguardを通らなかった |
| Green | `npm test` | 14 files、71 tests成功 |
| packed Node | `npm run verify:package` | Node境界、除去記録、迂回export禁止が成功 |
| packed consumer | `npm run verify:package` | TypeScript確認とVite buildが成功 |
| 全体build | `npm run build` | core、React、統合package、デモが成功 |

実ブラウザでのdrag、modal、詳細開閉の再操作は行っていない。今回の変更は入力防御と公開API境界で、既存UIについてはcomponent testとproduction buildを回帰証跡とした。デモbuildにはJavaScriptが500 kBを超えるVite警告が残るが、buildは成功している。

## 残る利用側責務

- APIのbody size、認証、認可、rate limitはAPI側で設定する。
- 正規化済みvalueだけをDBへ保存する順番は利用側が守る。
- `issues`へ元入力全体を追加してlogへ出さない。
- item本文など、このpackageの構成JSON以外の入力には、そのdata契約用のvalidatorを別途置く。
