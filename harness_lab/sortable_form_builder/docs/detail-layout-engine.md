# 詳細表示JSONエンジン

## 目的

dnd-kit一覧の各アイテム直下へ開く詳細領域に、個別JSONで指定したフィールド一覧とMarkdownを表示する。JSONを直接Reactコンポーネントへ渡さず、表示エンジン内部の防御層で検証・正規化してから描画する。

この防御層はPII削除やLLM出力の補正を行うsanitizerではない。詳細表示の構成定義とMarkdown本文を対象に、構造検証とMarkdown AST sanitizationを行う。

## 対象範囲

- dnd-kit一覧の本文クリックで開閉する行内詳細表示。
- ブラウザ上でのJSON検証、Markdown解析、React描画。

バックエンド、DB、保存方式、PII処理、認証は対象外です。

## 処理順

```text
unknownのJSONまたはJSON文字列
  -> JSON読取
  -> schemaVersion確認
  -> property/type/field参照/件数/文字数の検証
  -> MarkdownをASTとして解析
  -> raw HTML・画像・危険linkを除去
  -> 正規化済みDetailLayoutDefinition
  -> type別renderer
  -> React要素
```

- `filterDetailLayoutConfig` が防御層です。
- `sanitizeMarkdownForDisplay`はMarkdown本文を安全な文字列へ変換し、除去内容を`code / count`で返します。
- `DetailLayoutRenderer` は単独利用時に防御層を必ず通す。collection editorは読み込み時に1回だけ防御層を通し、`ValidatedDetailLayoutRenderer`へ正規化済みconfigだけを渡す。
- 未知propertyや未知typeは黙って削除せず、`code / path / message`を持つissueとして返します。
- JSON内のJavaScript、Reactコンポーネント、任意の実行関数は扱いません。

## 入力例

```json
{
  "schemaVersion": "configurable-detail-layout.v1",
  "sections": [
    {
      "id": "status",
      "type": "field-list",
      "title": "現在の設定",
      "columns": 2,
      "fields": ["title", "priority", "estimatedMinutes"]
    },
    {
      "id": "notes",
      "type": "markdown",
      "title": "記録",
      "source": {
        "kind": "field",
        "field": "notes"
      }
    }
  ]
}
```

## 対応type

| type | 責務 | 個別JSONで変えられるもの |
|---|---|---|
| `field-list` | 項目名と値の一覧表示 | 順序、対象field、1列/2列、見出し |
| `markdown` | Markdown本文の表示 | 固定本文、参照するtext/textarea field、見出し |

既存typeを使う新しいJSONを追加する場合、`detail-layout`配下のエンジン本体は変更しません。新しい表示typeが必要な場合だけ、型、検証、renderer、テストを同時に追加します。

## 防御ルール

既定値は`DEFAULT_DETAIL_LAYOUT_POLICY`へ置き、別の値が必要ならpolicyとして注入する。

| 項目 | 既定値 | 失敗時 |
|---|---:|---|
| JSON文書 | 64,000文字以下 | 全体を拒否 |
| section | 1から24件 | 全体を拒否 |
| section ID | 64文字以内、英字開始 | 全体を拒否 |
| section title | 1から100文字 | 全体を拒否 |
| Markdown | 1sectionあたり20,000文字以下 | 対象configまたは実データを表示しない |
| field-list | 1から24field | 全体を拒否 |
| link protocol | `http / https / mailto` | `href`を出力しない |

追加防御:

- `__proto__`、`prototype`、`constructor`をproperty名に持つJSONを拒否する。
- `fields`に存在しないfield参照を拒否する。
- Markdown sourceには`text`または`textarea`だけを許可する。
- raw HTMLと画像はMarkdown ASTから除去する。
- 許可していないprotocolのlinkは、linkを外して文字だけ残す。
- rendererでも`skipHtml`とURL変換を使い、描画時に再確認する。
- Markdownから生成できるHTML要素をallowlistへ限定する。
- Reactの`dangerouslySetInnerHTML`は使用しない。

## フロントエンド負荷

- 防御層とMarkdown変換はブラウザ側で実行する。
- 閉じている詳細はReact treeに作らないため、一覧全件のMarkdownを一括変換しない。
- config検証はcollection読込時の`useMemo`で1回行い、itemを開くたびには再実行しない。
- production buildの実測はJavaScript `467.77 kB`、gzip後 `143.24 kB`。
- 数十section以下の詳細表示を想定する。大量行の全文Markdown常時表示は、このエンジンの対象外とする。

## 参照実装との対応

非公開SaaSの既存security moduleを設計参考にした。非公開パスとコード本体はこの文書へ記録しない。

| 区分 | 参照元で確認した考え方 | 今回の実装 |
|---|---|---|
| 引き継いだ | 直接parseを最初に試す | `detailLayoutGuard.ts`の`parseDocument`で実施 |
| 引き継いだ | JSON code fenceから本文を取り出す | policyで許可された単一の`json` fenceだけ受理 |
| 引き継いだ | 解析後の安全な値だけを後続へ渡す | guard成功時だけ正規化済みconfigをrendererへ渡す |
| 引き継いだ | 許可外入力をfail closedにする | 未知property、type、field参照、上限超過をissueとして拒否 |
| 今回追加 | Markdown本文の構文単位の防御 | `markdownSanitizer.ts`でASTを使い、raw HTML、画像、危険linkを除去 |
| 今回追加 | 表示直前の再確認 | `DetailLayoutRenderer.tsx`でもfield由来Markdownを再sanitize |
| 持ち込まない | PIIの正規表現置換 | 扱う情報が異なるため対象外 |
| 持ち込まない | 最初と最後の波括弧を探す救済parse | 意図しない部分受理を避けるため不採用 |
| 持ち込まない | Node.js専用sandbox、ACL、telemetry | ブラウザ表示moduleの責務外 |

今回のsanitize結果は、たとえば`<script>`を削除し、`[表示名](javascript:...)`を表示名だけへ変換する。入力を検査するだけで元の危険文字列を返す処理にはしていない。

## 確認

```bash
cd tooling/go-test-harness
go run ./cmd/test-harness run --root ../.. --spec harness_lab/sortable_form_builder/test_management/test-command-plan.json
```

共通runnerはGo標準ライブラリだけで動く。対象アプリ固有の`npm run test`、`npm run typecheck`、`npm run build`はJSON planから起動する。契約JSONは`packages/configurable-list-core/contracts/`に置く。

単体テストでは、正常なobject、JSONコードフェンス、未知type、存在しないfield、非textのMarkdown参照、危険property、raw HTML、画像、`javascript:` URL、sanitization記録、fail closedを確認する。
