# Configurable List Package 配布設計

## 結論

既存サンプルの挙動を保ったまま、次の3packageへ分けた。通常の利用側は`@torisetsu/configurable-list`だけをimportする。

| package | 責務 | 単独利用する場面 |
|---|---|---|
| `@torisetsu/configurable-list-core` | 型、入力防御、JSON契約、値移行、純粋な状態更新 | Reactを使わない検証処理やバックエンド |
| `@torisetsu/configurable-list-react` | dnd-kit、フォーム、行内詳細、構成編集、モーダル | 独自のcore import方針を持つReactアプリ |
| `@torisetsu/configurable-list` | coreとReact UIの再export | 通常のReactアプリ |

## 利用側の最小コード

```tsx
import { useState } from "react";
import {
  ConfigurableCollectionEditor,
  type CollectionDefinition,
  type ConfigurableItem,
} from "@torisetsu/configurable-list";
import "@torisetsu/configurable-list/styles.css";

const definition = {
  schemaVersion: "configurable-collection.v1",
  id: "notes",
  label: "確認項目",
  itemLabel: "項目",
  creation: { initialTitle: { field: "title", value: "新しい項目" } },
  display: { titleField: "title", summaryField: "notes" },
  fields: [
    { name: "title", type: "text", label: "名前", required: true },
    { name: "notes", type: "textarea", label: "詳細" },
  ],
} satisfies CollectionDefinition;

export function Example() {
  const [items, setItems] = useState<Array<ConfigurableItem>>([]);
  return (
    <ConfigurableCollectionEditor
      definition={definition}
      items={items}
      onItemsChange={setItems}
    />
  );
}
```

保存先、API、DB、認証はpackageの責務に含めない。利用側が`items`を保持し、`onItemsChange`の結果を必要な保存先へ渡す。

## 既存挙動を変えない条件

- `追加`で一覧末尾へ項目が入り、表示番号は現在の配列順から振る。
- 並び替え後の番号は`1, 2, 3...`へ追従する。
- 一覧本文で対象行の詳細を開閉する。
- 編集はモーダルで行い、詳細と同時に開かない。
- 構成編集は視覚編集を主とし、JSON編集も残す。
- 新しいfieldは既存itemへ空値で追加し、行内詳細には未入力でも表示する。

## 配布物

各packageはESM、TypeScript宣言、必要なCSSまたは契約JSONだけをtarballへ含める。テスト、デモ、開発用設定は含めない。

```bash
npm run build:packages
npm run verify:package
```

`verify:package`は次を自動確認する。

1. 3packageを`.tgz`へ梱包する。
2. 空の一時consumerへtarballを展開する。
3. consumerが統合packageだけをimportしたTypeScriptコードを確認する。
4. Viteでブラウザ用JS/CSSをbuildする。

2026-09-07の実結果:

```text
consumerTypecheck: passed
consumerBuild: passed
emittedAssets: JavaScript 1件、CSS 1件
```

## 現在の配布範囲

tarballによるローカルまたは社内配布まで確認済み。公開registryへのpublishは未実施。package名の利用権、公開範囲、licenseを決めるまでは`UNLICENSED`とする。
