# TODO UI / ハーネス改善まとめ

作成日: 2026-08-27

このファイルは、TODOアプリ改善で何ができたか、どの品質水準まで来たか、どのskillが効いたか、得られた暗黙知を一枚で見るためのまとめです。

優先度とおすすめ度は5が高い。

## 1. 結論

- ローカル実験用TODOアプリとしては、実用確認できる水準まで到達した。
- UIは、ユーザーの修正指摘を受けて、個人的に満足できる水準に近づいた。
- ハーネスは、型、unit、API契約、APIフロー、実ブラウザE2E、a11y、依存方向、汎用性、traceabilityまで確認できる。
- ただし、本番SaaS品質ではない。認証、DB、権限、複数ブラウザ、実運用監査は未対応。

品質の見方:

| 視点 | 水準 | 理由 |
|---|---:|---|
| ローカルTODOアプリ | 4 / 5 | 作成、編集、削除、完了、分類、検索、並び替え、詳細toggleが動く |
| UI/UX | 4 / 5 | ユーザー指摘を反映し、ノイズ、配置、クリック範囲、入力metaを改善した |
| ハーネス実験素材 | 4 / 5 | 複数checkと証跡があり、改善ループの材料として使える |
| 本番SaaS | 2 / 5 | 認証、DB、権限、監査、複数環境確認がまだない |
| 再現性 | 4 / 5 | docs、skill、chat log、harness_runsに残っている。総作業時間だけ未計測が残る |

## 2. 変更規模

中心commit:

| commit | 内容 | 規模 |
|---|---|---:|
| `6748efc` | TODO UI、API、ハーネス、docs、skillをまとめて改善 | 92 files、+4000 / -319 |
| `4205369` | UI暗黙知チートシートを追加 | 4 files、+159 / -6 |
| `6009ae2` | 評価コメントをchat logに追記 | 1 file、+44 |

主な追加・更新:

- UI: `TodoCategoryBar`、作成/編集modal、詳細inline toggle、完了一覧。
- API: `categories.json`、`GET/POST /api/categories`、`completedAt`。
- ハーネス: category contract、API flow更新、Playwright E2E更新。
- docs: UIフィードバック表、作業証跡、レビュー入口、品質仕様。
- skill: `ui-value-design-review` と暗黙知チートシート。

## 3. できたこと

### 3.1 UI

- `Quality Harness` を利用者UIから削除。
- `/todos/new` で作成modalを表示。
- 編集はmodal表示に統一。
- 詳細は対象カード内のinline toggleに変更。
- 右側の `詳細 / 閉じる` ボタンを削除。
- カード本文/余白クリックで詳細を開閉。
- checkboxだけが完了操作になるように分離。
- 件数表示をヘッダーから一覧セクションへ移動。
- 通常UIから `再読み込み` ボタンを削除。
- 完了済みTODOを `/todos/completed` へ分離。
- 完了済みは `completedAt` の新しい順に表示。

### 3.2 入力と分類

- タイトルと分類を必須にした。
- タイトル `80文字`、説明 `400文字` の上限を表示。
- 入力中の文字数を表示。
- 必須/任意badgeをlabel横に表示。
- 分類を `categories.json` で管理。
- `プライベート / 仕事 / 日常` を locked default category として保存。
- 任意の分類を追加できる。
- 分類色を選び、chip/badgeへ反映。
- 分類チップを横スクロール可能にした。

### 3.3 ハーネス

- `npm run check` で通常品質確認を実行。
- `npm run check:browser-quality` で実ブラウザE2Eとaxe a11yを確認。
- `npm run check:dependency-boundary` でimport境界と循環依存を確認。
- `npm run check:api-contract` でTODO/分類データの形を確認。
- `npm run check:api-flow` でAPIの作成、更新、完了、削除を確認。
- `npm run check:test-traceability` で要件とテストspecの対応を確認。
- `npm run check:harness-genericity` で汎用runnerへの個別path混入を確認。

## 4. 品質証跡

最新確認:

| 確認 | 結果 | 証跡 |
|---|---|---|
| typecheck | OK | `npm run typecheck` |
| unit | OK、9 tests | `npm run test:unit` |
| API contract | OK、todos 8 records / categories 4 records | `npm run check:api-contract` |
| browser quality | OK、E2E / a11y | `harness_runs/2026-08-26T17-26-39-427Z-63092/summary.md` |
| dependency boundary | OK | `harness_runs/2026-08-26T17-30-13-859Z-72878/summary.md` |
| default check | OK、12 OK / 3 SKIP | `harness_runs/2026-08-26T17-31-03-340Z-75116/summary.md` |
| skill validation | OK、checked=8 errors=0 | `validate_skills.py .agents/skills` |
| git whitespace | OK | `git diff --check` |

`npm run check` のSKIP:

- `browser-e2e`: 通常checkでは重いため、明示フラグ時に実行。
- `browser-a11y`: 通常checkでは重いため、明示フラグ時に実行。
- `dependency-boundary`: summary上では通常profile内はSKIP。専用checkではOK確認済み。

## 5. ユーザーフィードバックと最終成果物

| フィードバック | 修正前 | 最終成果物 |
|---|---|---|
| `/todos/new` に移っても画面が変わらない | URLだけ変わる | 作成modalを表示 |
| `Quality Harness` は不要 | 画面とtitleに表示 | 利用者UIから削除 |
| 詳細が右上に出る | 対象との関係が遠い | 対象カード内で開閉 |
| 閉じる操作が遠い | 右上詳細panel前提 | カード本文再クリックで閉じる |
| 詳細/閉じるボタンが違和感 | 操作が重複 | 右側ボタン削除、`+ / -` 表示 |
| title clickでTODOが消える | labelがtitleを包む | checkboxだけ完了操作 |
| 必須/任意が遠い | 補足文で説明 | label横badgeへ移動 |
| 文字数が分かりにくい | 表示なし/遠い | 入力欄下に `n / 上限文字` |
| 分類を自由追加したい | 固定enum寄り | `categories.json` + 追加UI |
| 完了済みを分けたい | 通常一覧に混ざる | `/todos/completed` で新しい順 |

## 6. UXの見方

今回効いた観点:

- 提供価値: そのUIで何が楽になるか。
- 対象との近さ: 詳細や操作が対象TODOの近くにあるか。
- 責務: 作成、編集、詳細、一覧、内部情報が混ざっていないか。
- 状態変化: 押した後に画面上で変化が分かるか。
- クリック範囲: 見た目と実際の反応範囲が一致しているか。
- 入力meta: 必須、任意、文字数、エラーが入力欄近くにあるか。
- ノイズ: 利用者の作業に関係ない情報を出していないか。
- ハーネス化: 感覚的な違和感を、機械で見られる条件へ変換できるか。

具体例:

- 人間の違和感: `詳細が右上に出るのは変`
- 変換後の確認条件: `詳細は対象カード内で表示される`
- E2E条件: `カード本文クリックで詳細が開き、もう一度クリックで閉じる`

## 7. skillが役に立った場所

| skill | 役に立った場所 | 効果 |
|---|---|---|
| `chat-log-discipline` | ユーザー原文、AI作業要約の保存 | 後から指示と対応を追える |
| `ui-value-design-review` | UI違和感の分解 | 提供価値、配置、責務、クリック範囲へ変換できた |
| `quality-harness-documentation-governance` | ハーネス仕様と証跡の整理 | 何をどう確認したかを書けた |
| `task-deadline-stakeholder-planning` | 重くなった作業の分割意識 | 実装、確認、docs、pushを区切れた |
| `task-output-format-governance` | 出力型、チェックリスト、具体例 | 抽象説明だけで終わるのを避けた |
| `cognitive-model-calibration` | 認知ズレ、説明粒度、余計な推論の保存 | 次回の同じズレを減らす土台になった |
| `app-runtime-operations-governance` | 起動、終了、ログ、サーバ状態 | 古いプロセスやURL確認の扱いを整理できた |
| `codex-skill-maintenance` | skill構文検証 | `checked=8 errors=0` を確認できた |

## 8. 作業時間

厳密な総作業時間は未計測。

確認できる時間:

- harness証跡の範囲: `2026-08-26T15:33` から `2026-08-26T17:31` UTC。
- 上記は約1時間58分。
- JSTでは `2026-08-27 00:33` から `02:31` 頃。

記録済みの作業時間:

| 区分 | 時間 |
|---|---:|
| 分類追加 | 約5分 |
| ハーネス修正 | 約10分 |
| ドキュメント整合 | 約3分 |
| 最終check | 約6秒 |
| 追加UI修正 | 約20分 |
| クリック範囲修正 | 約9分 |
| 記録済み合計 | 約47分 |

未計測:

- 既存照合。
- 初期UI修正。
- 会話でのすり合わせ。
- 方針変更後の細かい確認。

時間がかかった理由:

- 0ベースに近い実装だった。
- UIだけでなく、型、API、JSON、E2E、docs、skill、chat logまで同時に波及した。
- 一度 `詳細modal` 側へ寄せた後、最終的に `詳細=inline toggle / 編集=modal` へ戻した。
- checkboxのlabel範囲など、画面上では小さく見えるが挙動に直結する問題があった。

## 9. 作業を細かいステップに分けると

| 順番 | ステップ | 成果 |
|---:|---|---|
| 1 | 既存UI、docs、harnessを確認 | 未達チェックリストを把握 |
| 2 | ユーザー指摘を分類 | ルート、ノイズ、配置、責務、入力meta、クリック範囲へ分解 |
| 3 | UI方針を決める | 作成/編集はmodal、詳細はinline toggle |
| 4 | データ型を修正 | `categoryId`、`completedAt`、分類model追加 |
| 5 | APIを修正 | categories API、TODO status更新、保存JSON更新 |
| 6 | UIを修正 | category bar、form meta、completed page、detail toggle |
| 7 | E2E/unitを修正 | CRUD、分類、詳細、編集、完了、削除を確認 |
| 8 | ハーネスを更新 | contracts、scenario、browser checkを更新 |
| 9 | docs/skill/logを更新 | 再発防止と暗黙知を保存 |
| 10 | 検証してpush | check通過、commit、push |

次回の理想:

- 先にUI方針を1枚で固定する。
- その後に `型/API/UI/E2E/docs` の順で小さく進める。
- 違和感が出たら `ui-tacit-knowledge-cheatsheet.md` へケース化する。

## 10. 得られた暗黙知

- UIの配置は、見た目ではなく責務の表れ。
- 詳細は対象から遠い場所に出すと、何の詳細か分かりにくい。
- 作成/編集/詳細は、表示形式を混ぜると操作が混乱する。
- 内部成果物名は、利用者UIに出すとノイズになる。
- checkboxのクリック範囲は、小さい見た目でも大きな挙動バグにつながる。
- `done` に移動する仕様は、説明が弱いと削除されたように見える。
- 人間の違和感は、ハーネスが直接拾うものではない。
- ハーネス化するには、違和感を観察可能な条件に変換する必要がある。
- E2Eは、広い文字列検索より対象要素を絞る方がよい。
- field metaからlabel、validation、文字数表示へつなぐとズレにくい。
- 速く作ることと、雑に作ることは別。
- AIが「できた」と言う前に、実際に動作確認と証跡が必要。

## 11. 未対応

| 未対応 | 優先度 | おすすめ度 | 理由 |
|---|---:|---:|---|
| 分類の編集/削除 | 3 | 3 | 小さいTODOでは必須ではないが、分類が増えると必要 |
| 削除確認の独自modal化 | 4 | 4 | `window.confirm` は簡単だが、UI統一感は弱い |
| URL query同期 | 3 | 3 | 共有URLが必要になったら有効 |
| API失敗時のretry UI | 4 | 4 | 実運用に近づけるなら必要 |
| Firefox/Safari/mobile確認 | 3 | 4 | ブラウザ差分を見るなら必要 |
| 手動キーボード/読み上げ確認 | 4 | 4 | axeだけでは拾えない |
| 認証/DB/権限 | 5 | 2 | 本番化なら必須。今回のローカル実験では対象外 |

## 12. 次に測るとよい数値

| 指標 | 目的 | 例 |
|---|---|---|
| 修正依頼回数 | AIが最初から期待へ近づけたか | 7回から2回へ減ったか |
| 所要時間 | 速くなったか | 3時間から45分へ減ったか |
| Harness検出数 | 機械で拾えた問題数 | 仕様差分18件中9件 |
| 人間検出数 | 人間だけが拾った問題数 | UI違和感5件中4件 |
| 再発件数 | skill化が効いたか | labelクリック事故が再発0件 |
| 最終満足度 | 実物として使えるか | 1から5で4以上 |

目標例:

```text
以前: 修正5回、3時間
改善後: 修正1回、45分、品質条件100%通過
```

## 13. 参照

- `docs/ui-feedback-review-checklist.md`
- `docs/ui-feedback-work-log.md`
- `docs/quality-harness-spec.md`
- `docs/component-purpose-checklist.md`
- `docs/component-relation-map.md`
- `docs/review-docs-and-skills-map.md`
- `.agents/skills/ui-value-design-review/SKILL.md`
- `.agents/skills/ui-value-design-review/references/ui-tacit-knowledge-cheatsheet.md`
- `internal_refs/chat_logs/2026-08-27.md`
