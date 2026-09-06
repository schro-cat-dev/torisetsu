# アイテム構成編集モーダル

## 目的

dnd-kit一覧のアイテム構成を画面またはJSONで変更し、同じ設定から新規フォーム、既存アイテム編集、一覧表示、行内詳細を更新する。並び替え、アイテム値編集、詳細表示の各処理は独立させ、構成変更だけを専用モーダルで扱う。

## 編集対象

```text
fields    入力fieldの名前、type、label、制約
creation  新規アイテムへ入れる仮タイトル
display   一覧と詳細で参照するfield、detailLayout
```

一覧の`id / label / itemLabel`は構成編集の対象外です。これらを固定することで、一覧の識別とアイテム構成変更を混ぜません。

## 画面動作

1. `構成を編集`を押す。
2. `画面編集`で一覧表示、新規追加、入力項目、詳細セクションを編集する。
3. 入力項目と詳細セクションは、drag handleまたはキーボードで並び替える。
4. 必要な場合だけ`JSON編集`へ切り替え、同じ構成を直接編集する。
5. `新しい構成を適用`を押す。
6. 不正な場合は`JSON path + 理由`を表示し、現在の構成とアイテムを変更しない。
7. 正常な場合は構成を差し替え、既存アイテムを新しいfieldsへ移行する。

詳細は行内トグルです。アイテム編集と構成編集のモーダルは同時に1つだけ開きます。

## 画面編集とJSONの関係

- 画面編集とJSON編集は、同じ`ItemCompositionDefinition`を扱う。
- 画面編集からJSONへ移る時は、現在値を整形済みJSONへ変換する。
- JSONから画面編集へ戻る時は、guardに成功した場合だけ画面へ反映する。
- 入力項目の表示名、識別名、type、制約、選択肢を画面で変更できる。
- 詳細セクションの見出し、識別名、type、表示field、Markdown sourceを画面で変更できる。
- field名を変えた場合は、一覧表示、新規追加、詳細セクションの参照も同時に更新する。
- fieldを削除した場合は、そのfieldを指す参照も削除する。タイトル用の文字fieldが0件になる削除とtype変更はUIで止める。
- 画面からfieldを追加した場合は、最初の`field-list`へ同時に追加する。`field-list`がなければ新しく作る。
- 追加fieldの値が空でも行内詳細から省略せず、fieldの表示名と`未入力`を表示する。
- 既存の保存済み構成やJSON編集で詳細へ未配置のfieldがある場合も、行内詳細の生成時に既存sectionへ補完する。Markdownが参照済みのfieldは重複表示しない。

## 既存アイテムの移行規則

| 変更 | 移行結果 |
|---|---|
| 同じfield名、同じtype | 既存値を引き継ぐ |
| `text`と`textarea`の相互変更 | 文字列を引き継ぐ |
| 新しいfield | 空文字。checkboxだけ`false` |
| type変更 | 空文字。checkboxだけ`false` |
| selectから既存値を削除 | 空文字 |
| numberのmin/max外になった | 空文字 |
| fieldを削除 | 新しい`values`から削除 |

アイテムの`id`と配列順は変更しません。構成にない旧データを隠して残すのではなく、新しいfield集合へ作り直します。

## 責務

| module | 責務 |
|---|---|
| `ItemCompositionEditorForm.tsx` | 画面/JSON modeの同期、エラー表示、適用通知 |
| `ItemCompositionVisualEditor.tsx` | 一覧表示、新規追加、入力項目、詳細セクションを接続 |
| `FieldConfigurationList.tsx` | 入力項目の追加、編集、削除、dnd-kit並び替え |
| `DetailSectionConfigurationList.tsx` | 詳細セクションの追加、編集、削除、dnd-kit並び替え |
| `visualCompositionEditor.ts` | 並び替えとfield参照更新の純粋関数 |
| `itemComposition.ts` | JSON解析、field契約検証、構成適用、既存値移行 |
| `ConfigurableCollectionEditor.tsx` | モーダルの開閉と、構成・item変更通知の調整 |
| `App.tsx` | collectionごとの現在構成を保持し、ブラウザへ保存 |

## 汎用性

- 既存の5つのfield typeであれば、JSON変更だけで構成を変更できます。
- 個別のfield名、label、選択肢、順序は共通moduleへ直書きしません。
- 新しいfield typeを追加する場合だけ、型、guard、フォームrenderer、詳細renderer、テストを変更します。
- 構成変更を使わない利用側は`onDefinitionChange`を渡さなければ、ボタンとモーダルが表示されません。

## テスト設計と実結果

| リスク | likelihood | impact | score | 証拠 |
|---|---:|---:|---:|---|
| 不正JSONで現在構成を壊す | 4 | 5 | 20 | guard unit test |
| field変更で既存値を誤対応させる | 4 | 5 | 20 | migration unit test |
| 複数modalが同時に開く | 3 | 4 | 12 | state reducer test |
| detailLayoutが新fieldと不整合になる | 3 | 5 | 15 | nested contract test |

Red:

- item composition API未実装によりimportが失敗した。
- 構成編集状態がないため、reducer testが2件失敗した。

Green:

- item composition test 4件が成功した。
- 行内詳細、空値表示、保存済み構成の補完、追加fieldの詳細登録、visual editor、modal排他状態を含む全test 46件が成功した。
- `npm run typecheck`と`npm run build`が成功した。

最新のGo共通runner実行は、別作業中のGo側で`harness.CheckCoverage`が未定義になっているためcompile前に停止した。今回対象の3 commandは直接実行してすべて成功している。Go側の並行変更はこの作業では修正していない。

実ブラウザのクリック操作はこのセッションでは未実施です。ローカルViteから更新後TSXが正常に変換・配信されることまでは確認しています。
