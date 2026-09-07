# 並び替えフォーム 詳細設計

## 目的

利用者が項目を追加、編集、削除、並び替えできる画面を提供する。フォーム固有の入力項目は設定へ分離し、同じReactコンポーネントを別の一覧でも使えるようにする。

## 対象範囲

- 単一一覧内のドラッグ・キーボード並び替え。
- `text`、`textarea`、`number`、`select`、`checkbox` の動的フォーム。
- 必須、最大文字数、数値の最小・最大の入力確認。
- 現在位置の連番付き項目の即時追加、行内詳細トグル、編集モーダル、削除。
- 個別JSONによる詳細表示の構成と、Markdownの安全なブラウザ描画。
- JSONによるアイテムfield構成の編集と既存アイテムの移行。
- デモデータのブラウザ保存。

複数一覧間の移動、サーバー保存、認証は初版に含めない。

## モジュール境界

| 場所 | 責務 | 個別情報を持つか |
|---|---|---|
| `packages/configurable-list-core/src/types.ts` | 入出力の型契約 | 持たない |
| `packages/configurable-list-core/src/fieldValues.ts` | 初期値作成と入力確認 | 持たない |
| `packages/configurable-list-core/src/input-boundary/` | JSON読取、総量制限、危険値拒否、Node/API接続adapter | 持たない |
| `packages/configurable-list-core/src/detail-layout/` | 詳細JSON検証とMarkdown防御 | 持たない |
| `packages/configurable-list-core/src/item-composition/` | 構成JSON検証、値移行、並び替えの純粋ロジック | 持たない |
| `packages/configurable-list-react/src/ConfigurableItemForm.tsx` | 設定から入力欄を描画 | 持たない |
| `packages/configurable-list-react/src/detail-layout/` | 検証済み詳細sectionを描画 | 持たない |
| `packages/configurable-list-react/src/item-composition/` | fieldと詳細sectionの視覚編集UI | 持たない |
| `packages/configurable-list-react/src/SortableItemList.tsx` | 一覧表示とdnd-kit操作 | 持たない |
| `packages/configurable-list-react/src/ConfigurableCollectionEditor.tsx` | 追加・編集・削除の画面状態を連携 | 持たない |
| `packages/configurable-list-react/src/ui/ModalDialog.tsx` | 編集内容を前面へ表示し、背面操作を分離 | 持たない |
| `packages/configurable-list/src/index.ts` | coreとReact UIの公開APIを一つにまとめる | 持たない |
| `src/demo/collectionDefinitions.ts` | 項目名、ラベル、選択肢、初期データ | 持つ |
| `src/demo/detailLayouts.json` | 一覧ごとの詳細section、順序、Markdown本文 | 持つ |
| `src/App.tsx` | デモ種別の切り替えとブラウザ保存 | 持つ |

## 入出力契約

`CollectionDefinition` がフォームと一覧の指示書です。`schemaVersion` は `configurable-collection.v1` 固定です。

```ts
const definition = {
  schemaVersion: "configurable-collection.v1",
  id: "contacts",
  label: "連絡メモ",
  itemLabel: "メモ",
  creation: {
    initialTitle: { field: "subject", value: "新しいメモ" },
  },
  display: {
    titleField: "subject",
    summaryField: "details",
    badgeField: "channel",
  },
  fields: [
    { name: "subject", type: "text", label: "件名", required: true },
    {
      name: "channel",
      type: "select",
      label: "連絡手段",
      options: [{ value: "chat", label: "チャット" }],
    },
  ],
};
```

一覧データは `{ id, values }` を持つ。画面の `No.` は識別番号ではなく現在位置であり、配列順から毎回 `1, 2, 3...` と表示する。並び替え後の配列全体を `onItemsChange` へ返すため、番号も新しい順番へ追従する。

## 画面動作

1. `追加` で `creation.initialTitle` の仮タイトルを持つ項目を一覧末尾へ即時追加する。`No.` は末尾の現在位置として表示する。
2. 一覧本文または詳細アイコンを押すと、対象項目の直下に詳細を開く。同じ項目をもう一度押すと閉じる。
3. 編集アイコンを押すと、対象値を汎用モーダル内の設定駆動フォームへ表示する。詳細は同時に開かない。
4. 保存時に設定由来の入力確認を行い、保存後は更新した項目の詳細を開く。
5. ドラッグ終了時に配列順を更新する。ハンドルへフォーカスしてSpaceを押すと、矢印キーでも移動できる。
6. デモ画面は変更後データを `localStorage` に保存する。共通モジュールは保存先を知らない。
7. `構成を編集`でfield構成をJSON編集し、適用時に既存アイテムを新しいfield集合へ移行する。

## 汎用性の受け入れ条件

- `collectionDefinitions.ts` に別の定義を1件追加しても、`packages/`の差分がゼロである。
- ラベル、項目名、選択肢、必須条件、一覧の見出し項目を共通モジュールへ直書きしない。
- 未対応の入力種類が必要になった場合だけ、`FieldDefinition` と描画処理を同時に拡張する。
- 既存の詳細section typeを使うJSONを追加しても、`detail-layout`配下の差分がゼロである。
- 詳細JSONは`filterDetailLayoutConfig`を通過しないままReactへ渡さない。
- item構成JSONは`filterItemCompositionConfig`を通過しないまま保存・適用しない。

詳細JSONの契約、防御ルール、ブラウザ負荷は [`detail-layout-engine.md`](./detail-layout-engine.md) を参照する。

共通JSON防御とNode/APIでの配置方法は [`input-defense-boundary.md`](./input-defense-boundary.md) を参照する。

構成編集と既存アイテムの移行規則は [`item-composition-editor.md`](./item-composition-editor.md) を参照する。

packageの配布境界とtarball検証は [`package-distribution.md`](./package-distribution.md) を参照する。

## 命名レビュー

| 名前 | 指している実体 | 判定 |
|---|---|---|
| `CollectionDefinition` | 一覧とフォームの表示・入力規則 | 採用。単なる `config` より対象が明確 |
| `ConfigurableCollectionEditor` | 設定可能な一覧全体の編集UI | 採用。追加・編集・削除を含む責務が読める |
| `ConfigurableItemForm` | 1項目の値を設定から編集するフォーム | 採用。`DynamicForm` より対象が明確 |
| `ModalDialog` | 任意の編集内容を載せる汎用モーダル | 採用。TODO固有の名前を持たない |
| `createDraftItem` | 定義の初期値から未編集項目を作る関数 | 採用。並び順の責務を混ぜず、保存済み完成データではないことが分かる |
| `SortableItemList` | 並び替え可能な項目一覧 | 採用。dnd-kit内部用語を外側へ広げていない |
| `itemsByCollection` | 一覧IDごとに保持する項目配列 | 採用。単なる `data` や `state` を避けている |
| `resolveEffective...` 型の名前 | 今回は該当処理なし | 追加しない |

## 確認項目

- 作業項目と連絡メモで異なる入力欄が出る。
- 追加操作だけで仮タイトルを持つ項目が一覧末尾へ入り、現在位置の `No.` が表示される。
- 並び替え後、上から `No. 1, 2, 3...` へ振り直される。
- 一覧本文クリックで対象項目の直下に詳細が開き、同じ本文をもう一度押すと閉じる。
- ドラッグ、編集、削除の操作で詳細トグルが誤作動しない。
- 詳細と編集は同時に開かず、白いモーダルが背景操作を止める。
- 編集内容だけが対象項目へ反映される。
- 削除対象だけが消える。
- マウスとキーボードで並び順を変えられる。
- 必須、文字数、数値範囲のエラーが入力欄の近くへ出る。
- 画面幅390pxと1280pxで、文言や操作が重ならない。
- 未知type、危険property、危険URL、raw HTMLが詳細表示へ入らない。
- 構成変更後、同名・互換型の値だけが残り、新規・非互換fieldは空欄になる。
