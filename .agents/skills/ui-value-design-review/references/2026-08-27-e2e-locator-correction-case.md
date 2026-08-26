# 2026-08-27 E2E確認対象修正ケース

## ユーザーフィードバック

```text
• 最後の削除確認もテスト指定が曖昧でした。削除後はタイトル文字列ではなく、対象 .todo-item が消えたことを確認する形に変えます。

• Edited harness_lab/todo_frontend/tooling/quality-harness/external-tools/playwright/tests/todo-crud.e2e.spec.ts (+1 -1)
    61    await editedItem.getByRole("button", { name: "削除" }).click();
    62 -  await expect(page.getByText(editedTitle)).toBeHidden();
    62 +  await expect(editedItem).toHaveCount(0);
    63  });
や軽微な機能やその関連するテストケースにミスがあるなど自律的に見つけて修正できたのはとてもいいと思います！
これを実際にサンプルとして追記または記載しつつ、TDDとか修正とか進めるときにskillとかで参考にできたら嬉しいなぁと思いますができたりしますかね
きちんと再現性出せると嬉しいですが
なぜ変更したかどう変更したかも見れるといいのかなあとは提供する価値として何が変わったかどういういいことがあったか
```

## 結論

このケースは、TDD/E2Eで失敗した時に `確認対象を完了条件に合わせて絞る` ための参考例として使う。

## 変更前

```ts
await editedItem.getByRole("button", { name: "削除" }).click();
await expect(page.getByText(editedTitle)).toBeHidden();
```

問題:

- `editedTitle` は一覧タイトルと詳細見出しの2箇所に出ることがある。
- `page.getByText(editedTitle)` は画面全体を見るため、削除対象のTODOだけを見ていない。
- 削除の完了条件は `文字列が見えないこと` ではなく、`対象TODO行が消えること`。

## 変更後

```ts
await editedItem.getByRole("button", { name: "削除" }).click();
await expect(editedItem).toHaveCount(0);
```

良い点:

- 確認対象が、削除したい `.todo-item` に限定される。
- 詳細見出しや別の場所の同じ文字列に引っ張られない。
- 削除後にDOM上から対象行が消えたことを直接確認できる。

## 使う判断基準

| 見ること | NG | OK |
|---|---|---|
| 対象 | 画面全体の文字列を見る | 操作した行、フォーム、ボタンなど対象を絞る |
| 完了条件 | 文字が消えたら削除成功とする | 削除対象の行が0件になったら削除成功とする |
| 失敗時の修正 | タイムアウトを延ばすだけ | locatorと期待値を仕様に合わせる |
| 価値 | テストがたまたま通る | 仕様ズレやUI重複に強い確認になる |

## 提供価値

- テストの嘘陽性を減らす。
- UIに同じ文言が複数あっても、確認対象を間違えにくい。
- AIが関係ない場所を直すリスクを減らす。
- 修正後に `どこが直ったか` を小さい単位で追いやすくなる。

## 追加ケース: 完了クリックで行が消える時

変更前:

```ts
await editedItem.getByRole("checkbox").check();
await expect(editedItem).toHaveCount(0);
```

問題:

- `check()` は、クリック後にcheckboxがチェック済みになることまで待つ。
- 今回の仕様では、完了したTODOは通常一覧から消える。
- つまり、確認したいことは `チェック済みになったか` ではなく `対象行が通常一覧から消えたか`。

変更後:

```ts
await editedItem.getByRole("checkbox").click();
await expect(editedItem).toHaveCount(0);
```

判断:

- UI操作で対象要素が消える仕様なら、`check()` や `fill()` 後の状態待ちが逆に邪魔になることがある。
- 完了条件に合わせて、`クリックできたか` と `対象が消えたか` を見る。

## 追加ケース: モーダルが背面操作を止める時

注意:

- このケースは、途中で詳細をmodal化していた時の失敗例。
- 最新方針では、詳細は行内トグル、編集はmodalに分ける。

変更前:

```ts
await todos.handleEditSave(selectedTodo.id, input);
navigate(`${detailBasePath}/${selectedTodo.id}`);
```

問題:

- 編集保存後に詳細モーダルへ戻ると、背面の一覧操作ができない。
- そのままE2Eが一覧のcheckboxを押そうとすると、`.modal-backdrop` がクリックを止める。

変更後:

```ts
await todos.handleEditSave(selectedTodo.id, input);
navigate(detailBasePath);
```

判断:

- 保存後にすぐ一覧操作を続けたい流れでは、モーダルを閉じる。
- 詳細確認を続けたい場合だけ、詳細モーダルへ戻す。
