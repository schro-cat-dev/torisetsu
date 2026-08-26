# 2026-08-27 クリック範囲とmodal表示の修正ケース

## ユーザーフィードバック

```text
なんかui上でアイテムをクリックするとアイテムが消えていくんですが、、、なんで？？
削除ボタンじゃないところクリックするとです
あと詳細ボタン押すと画面がバグって...何も見えないです
そして編集ボタン押すと一緒に詳細ボタンが後ろの方で起動してるみたいです

こーれは、、、、
次ないように注意できますか？
あとこのフィードバックとか同じようにならないように気をつけるようにしてほしいですルールとして

ほんとですねdoneになったんですね

あとは詳細ボタン押さなくても空白のところとか押したら詳細が見れる、表示されるようにしてほしいです
できるかな？
```

## 何が起きたか

| 現象 | 原因候補 | 実害 |
|---|---|---|
| TODOタイトル付近を押すと消える | checkbox用の `label` がタイトル全体を包んでいた | 意図せず `done` になり、通常一覧から外れる |
| 詳細modalが見えない | 一時的に詳細をmodalへ寄せたが、最終方針と合わなかった | 最終方針では詳細は行内トグル、編集はmodalに分ける |
| 編集と詳細が混ざって見える | modal表示の確認が不足していた | どの状態を開いているか分かりにくい |
| 空白クリックでも詳細を見たい | 行クリックとcheckboxクリックを分ける必要があった | カードクリックは詳細、checkboxは完了、ボタンは各操作に分ける |

## 修正したこと

変更前:

```tsx
<label className="checkbox-row">
  <input type="checkbox" />
  <span className="todo-title">{todo.title}</span>
</label>
```

問題:

- `label` の中のタイトルを押しても checkbox が反応する。
- 完了したTODOを通常一覧から外す仕様と組み合わさり、削除していないのに消えたように見える。

変更後:

```tsx
<div className="todo-main">
  <input type="checkbox" aria-label={`${todo.title}を完了にする`} />
  <button type="button" onClick={() => onToggleDetail(todo.id)}>
    <span>{todo.title}</span>
  </button>
</div>
```

良い点:

- checkboxだけが完了操作になる。
- タイトルやカード周辺を押すと、詳細だけが開閉する。
- TODOが通常一覧から外れるのは、checkboxで完了にした時だけになる。
- `aria-label` でcheckboxの意味は残る。

作成/編集modal側:

```css
.modal-shell {
  background: #ffffff;
  border: 1px solid #d8ddda;
  border-radius: 8px;
}
```

良い点:

- 作成や編集の中身が白い面の上に出る。
- 背景の暗さとmodal本体が分かれる。

詳細トグル側:

```tsx
<button
  type="button"
  className="todo-summary-button"
  onClick={() => onToggleDetail(todo.id)}
>
  <span>{todo.title}</span>
</button>
```

良い点:

- カード本文や余白を押すと詳細が開く。
- もう一度押すと詳細が閉じる。
- checkboxを押した時だけ完了になる。
- 編集、削除のボタンは詳細トグルに巻き込まれない。

## 次回の確認条件

- TODOカードのタイトルをクリックしても、行が消えない。
- TODOカードの本文や余白をクリックすると、詳細が行内で開く。
- もう一度クリックすると、詳細が閉じる。
- 完了checkboxをクリックした時だけ、通常一覧から消える。
- 右側に `詳細 / 閉じる` ボタンを置かない。
- `編集` を押すと、編集modalだけが見える。
- 詳細トグルと編集modalが混ざらない。
- modalの背面は薄暗く、操作できないことが分かる。

## 再発防止ルール

- UI変更では、見た目だけでOKにしない。
- クリック範囲、イベント伝播、label/input関係、modalの重なりを確認する。
- E2Eには `押してはいけない場所を押しても状態が変わらない` 確認を最低1つ入れる。
