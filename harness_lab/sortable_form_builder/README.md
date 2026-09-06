# Sortable Form Builder

`dnd-kit`を使った並び替え一覧と、設定で項目を変えられるReact/TypeScriptフォームです。既存サンプルと、他のアプリから再利用する3つのpackageを同じworkspaceで管理します。

## 起動

```bash
npm install
npm run start:local
npm run status:local
npm run stop:local
```

既定URL:

```text
http://127.0.0.1:5184/
```

## 確認

```bash
npm run typecheck
npm run test
npm run build
npm run verify:package
```

`npm test`と`verify:package`は3つのtarballを`.artifacts/`へ作り、別の一時consumerから型確認とVite buildを行います。

## Package構成

| package | 責務 | React依存 |
|---|---|---|
| `@torisetsu/configurable-list-core` | 型、JSON検証、Markdown防御、値移行、状態更新 | なし |
| `@torisetsu/configurable-list-react` | dnd-kit一覧、設定フォーム、行内詳細、モーダル | あり |
| `@torisetsu/configurable-list` | 上記2つを一つのimport先にまとめる | あり |

通常の利用側は統合packageだけを参照します。

```tsx
import {
  ConfigurableCollectionEditor,
  type CollectionDefinition,
} from "@torisetsu/configurable-list";
import "@torisetsu/configurable-list/styles.css";
```

フォーム固有の項目、ラベル、選択肢、一覧表示項目は `src/demo/collectionDefinitions.ts` に置いています。新しいフォームを追加するとき、共通モジュールの変更は不要です。

既存サンプルの`src/App.tsx`も統合packageを利用しています。一覧本文は対象行の直下に詳細を開閉し、編集アイコンは編集モーダルを開きます。

詳細設計は `docs/design.md` を参照してください。

個別JSONによる詳細表示、ブラウザ側の防御フィルター、Markdown描画の契約は `docs/detail-layout-engine.md` を参照してください。

アイテムfield構成を画面またはJSONで編集するモーダルと、既存アイテムの移行規則は `docs/item-composition-editor.md` を参照してください。

配布物、依存関係、受け入れ確認は `docs/package-distribution.md` を参照してください。
