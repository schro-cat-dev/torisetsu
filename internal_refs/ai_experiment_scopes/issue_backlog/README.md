# Issue Backlog

作成日: 2026-08-31

## 目的

今後やりたいこと、未完了のこと、確認したいことをissue候補として分類し、見ることリストとチェック欄を持たせる。

ここでの `issue` は、GitHub Issueへ起票する前の作業単位を指す。具体例: `モデル調査の導線修正`、`UI route card checker作成`。

## 非ゴール

- ここで人の能力評価をしない。
- 未確認の案を完了扱いにしない。
- GitHub Issueを無条件に増やさない。
- API keyやsecretを記録しない。

## issue分類

| 分類 | 対象 | 具体例 | 完了証跡 |
|---|---|---|---|
| `research` | 事実確認、外部repo確認、モデル公開情報 | GPT/Claude公開情報、EvalBench、promptfoo | 調査メモ、source URL、確認日 |
| `design` | 仕組み、schema、route、mode | Development Route Cards、support mode | README、schema draft、NG/OK例 |
| `implementation` | script、checker、adapter、fixture | route card checker、model drift adapter | 実装ファイル、実行結果 |
| `evaluation` | 比較、採点、効果測定 | APIなしfixture比較、UI小部品試行 | run result、metrics、残リスク |
| `cost` | API費用、token、latency、費用対効果 | API key前の費用判断、cheap model比較 | cost table、実測またはskip理由 |
| `handoff` | 初見の人が辿れる導線、引き継ぎ | root README導線、Issue一覧 | READMEリンク、チェック済み項目 |

## issue化する条件

次のうち2つ以上に当てはまるものをissue候補にする。

- 複数ファイルを触る。
- 30分以上かかる見込みがある。
- 完了条件を明示しないと終わったか分からない。
- 後で同じ判断を再利用する。
- API、外部repo、model、skill、harnessのどれかに関係する。
- ユーザー確認が必要な分岐がある。

## 現在のissue候補

| ID | 分類 | title | 優先度 | 状態 | 参照 |
|---|---|---|---:|---|---|
| IB-001 | `research` | GPT/Claudeモデル調査レポートの導線を強化する | 5 | 未着手 | `benchmark_threshold_design/reports/2026-08-31-current-frontier-models-evaluation-protocol.md` |
| IB-002 | `research` | 外部ハーネス/skill候補のGitHub URLをユーザー確認用に整理する | 5 | 一部完了 | `external_refs/ai_harness_skill_integration_references/README.md` |
| IB-003 | `design` | Development Route Cardsを使える仕様にする | 5 | 設計済み、実体未作成 | `development_route_cards/README.md` |
| IB-004 | `implementation` | `ui.feature.add.v1` route card JSONを作る | 5 | 未着手 | `development_route_cards/task_list.md` |
| IB-005 | `implementation` | route card checkerを作る | 5 | 未着手 | `development_route_cards/task_list.md` |
| IB-006 | `evaluation` | 小さいUIコンポーネントでroute cardを試す | 5 | 未着手 | `development_route_cards/task_list.md` |
| IB-007 | `cost` | API keyなしでモデル比較価値を検証する | 5 | 一部完了 | `model_drift_watch/fixtures/` |
| IB-008 | `cost` | API keyあり実行の費用上限と実行条件を決める | 4 | 未着手 | `model_drift_watch/README.md` |
| IB-009 | `implementation` | EvalBench / promptfoo結果をlocal observationへ変換するadapter設計を作る | 4 | 未着手 | `external_refs/ai_harness_skill_integration_references/README.md` |
| IB-010 | `handoff` | root READMEから主要調査レポートへ直接辿れる導線を追加する | 5 | 未着手 | `README.md` |
| IB-011 | `evaluation` | OSS LLMをColab無料枠とローカルで試す | 5 | Colab CPUでQwen3 0.6Bの基礎検証完了。次は分割promptとローカル比較 | `benchmark_threshold_design/runbooks/2026-09-04-oss-llm-colab-local-runbook.md` |

## 見ることリスト

### IB-001 GPT/Claudeモデル調査レポートの導線

- [ ] root READMEから直接または2クリック以内で辿れる。
- [ ] 対象モデルが分かる。
- [ ] 何が公開事実で、何が未公開か分かる。
- [ ] 価格、context、output、reasoning/thinking、安全機構の項目がある。
- [ ] 採用判断ではなく、検証プロトコルへ接続されている。
- [ ] 調査日とsource URLがある。

### IB-002 外部ハーネス/skill候補

- [ ] GitHub URLが一覧で見られる。
- [ ] 公式/公的/OSSの信用ランクが分かる。
- [ ] なぜ調査するかがrepoごとにある。
- [ ] 何を統合候補にするかがrepoごとにある。
- [ ] 直接導入しない条件がある。
- [ ] 最初に見る順番がある。

### IB-003 Development Route Cards

- [ ] `route card` が何か分かる。
- [ ] `support mode` が何か分かる。
- [ ] `quality level` が何か分かる。
- [ ] 強い制約ではなく、開発の型として説明されている。
- [ ] 人の能力評価ではなく、作業環境の評価として説明されている。
- [ ] 実装に必要な次タスクが分かる。

### IB-004 `ui.feature.add.v1` route card JSON

- [ ] `routeId` がある。
- [ ] `appliesTo` と `notAppliesTo` がある。
- [ ] `requiredInputs` がある。
- [ ] `steps` が順番付きである。
- [ ] 各stepにgateがある。
- [ ] `minimum pass / standard / expert` がある。
- [ ] learner用のNG例/OK例がある。

### IB-005 route card checker

- [ ] 入力JSON pathを引数で受け取る。
- [ ] route固有のpathをrunnerへ直書きしない。
- [ ] 必須field不足を落とせる。
- [ ] support modeの許可値を確認できる。
- [ ] quality levelの許可値を確認できる。
- [ ] 結果JSONを保存できる。
- [ ] 失敗時にどのfieldが不足か分かる。

### IB-006 小さいUIコンポーネント試行

- [ ] 対象コンポーネントを1つに絞る。
- [ ] 汎用的に使えるpropsが定義されている。
- [ ] 見た目だけでなく使う場面が書かれている。
- [ ] route cardあり/なしの比較条件がある。
- [ ] 修正回数、詰まり時間、AI確認回数を記録する。
- [ ] 実装、検証、残リスクが残っている。

候補:

| component | 理由 | 注意 |
|---|---|---|
| `FilterResetButton` | 状態変更とUI操作が小さい | TODO固有のfilter名を直書きしない |
| `StatusBadge` | props設計と見た目の再利用を見やすい | 色だけで意味を伝えない |
| `EmptyState` | 文言、action、表示条件を分けやすい | 説明文を増やしすぎない |

### IB-007 API keyなしでモデル比較価値を検証

- [ ] 会話上の出力をraw fixtureとして保存する手順がある。
- [ ] 同じprompt、同じcase、同じcontractで比較する。
- [ ] tokenとlatencyは未測定扱いにする。
- [ ] contract pass、task score、source traceは測れる。
- [ ] 人間修正時間は手入力fieldにする。
- [ ] API keyありでしか見えない項目を分ける。

### IB-008 API keyあり実行の費用上限

- [ ] API keyをチャットやログへ貼らない。
- [ ] 一時keyまたは低い利用上限にする。
- [ ] 実行case数を固定する。
- [ ] max output tokensを固定する。
- [ ] 実行前に予算上限を決める。
- [ ] 実行後にtoken、latency、cost、品質を保存する。

### IB-009 外部result adapter設計

- [ ] EvalBenchのresult形式を確認する。
- [ ] promptfooのJSON出力形式を確認する。
- [ ] local observationへ写せるfieldを分ける。
- [ ] 写せないfieldは未対応にする。
- [ ] adapterのinput/output schemaを書く。
- [ ] 外部CLI実行は別tool specへ分ける。

### IB-010 root README導線

- [ ] モデル調査レポートへのリンクがある。
- [ ] 外部ハーネス/skill統合参照へのリンクがある。
- [ ] Development Route Cardsへのリンクがある。
- [ ] モデルドリフト監視へのリンクがある。
- [ ] 読む順番が分かる。

### IB-011 OSS LLM Colab / Local Trial

- [x] Colab無料CPUで試す手順がある。
- [x] ローカルOllamaで試す手順がある。
- [x] llama.cppで試す手順がある。
- [x] OpenAI-compatible APIとして接続する手順がある。
- [x] 同一promptで比較するcaseがある。
- [x] 超軽量な実運用タスクの依頼内容がある。
- [x] 実運用タスクを落語学習の構造化アウトプット確認へ上方修正した。
- [x] 結果記録テンプレートがある。
- [x] 問題が発生した場合の対応とColabやり直し手順がある。
- [x] `max_new_tokens` の公式仕様とmodel context上限の扱いを記載した。
- [x] Colab無料CPUの環境確認セルを実行した。
- [x] Colab無料CPUで `Qwen/Qwen3-0.6B` のmodel loadを実行した。
- [x] Colabで最小推論を実測した。
- [x] thinking抑制とセル全体時間計測を入れた新版セルで再測定した。
- [x] 同一smokeを2回実行し、速度と出力傾向の再現性を確認した。
- [x] `max_new_tokens=320` で短文計画を再試行した。
- [x] `max_new_tokens=860` で短文計画を再試行した。
- [x] 旧smokeの `do_sample=False` がQwen公式推奨presetとズレていたことを記録した。
- [ ] Qwen公式推奨presetで短文計画を再試行する。
- [ ] `max_new_tokens=480` から `600` と重複禁止付きpromptで短文計画を再試行する。
- [ ] 日本語指定、英語禁止、入力本文ありのJSON caseで再試行する。
- [x] 落語学習promptで長めの構造化出力を実測する。
- [x] 落語学習promptを5段階評価付きに上方修正し、`max_new_tokens=1600` の実行セルを追加した。
- [x] 落語学習promptに反復抑制、抽象文のNG/OK例、見出しごとの役割分離を追加した。
- [x] `話の強弱`、`起承転結`、`盛り上がり` の評価軸混同を記録し、promptで分離した。
- [x] 評価軸混同について、中学生にも分かる具体例をpromptと証跡へ追加した。
- [x] `rakugo.learning.plan.scored.001` を `max_new_tokens=1600` で実測する。
- [x] 評価軸分離後の `rakugo.learning.plan.scored.001` を再実測する。
- [x] `rakugo.learning.case.practice.001` の追加promptをrunbookへ追加する。初期値は `max_new_tokens=2000`、重い場合は `1600` に下げる。
- [ ] 本文生成、評価基準生成、自己チェックを分割して実測する。
- [ ] `rakugo.learning.case.practice.001` を実測する。
- [ ] 評価表の見出し不足、score重複、途中切れを簡易scriptで確認する。
- [ ] ローカルOllamaで実測する。
- [x] 初回実測結果を `experiments/` 配下へ保存する。
- [x] 新版セルの再測定結果を `experiments/` 配下へ保存する。

## GitHub Issue化テンプレート

~~~markdown
## 目的

<何のためにやるか>

## 対象

<対象ファイル、対象機能、対象repo>

## 完了条件

- [ ] <判定できる条件>

## 見ること

- [ ] <確認項目>

## 実行・確認コマンド

```bash
<command>
```

## 証跡

- <result file or log>

## 残リスク

- <残る不確実性>
~~~

## 次のおすすめ順

1. IB-010: root README導線を先に直す。
2. IB-001: モデル調査レポートをユーザー確認しやすくする。
3. IB-004: `ui.feature.add.v1` route card JSONを作る。
4. IB-005: route card checkerを作る。
5. IB-006: 小さいUIコンポーネントで試す。
6. IB-007: API keyなしのfixture比較を整理する。
7. IB-008: 費用上限を決めてからAPI keyあり実行へ進む。
8. IB-011: OSS LLMをColab無料枠とローカルで試す。

理由:

- 先に導線を直すと、ユーザーが調査内容を確認しやすい。
- route cardは、JSONとcheckerができるまで実用段階ではない。
- API keyありの検証は、APIなしで価値が見えた後に進める。
