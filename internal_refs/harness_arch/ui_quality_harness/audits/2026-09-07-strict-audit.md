# UI品質ハーネス厳格監査

## 是正結果（2026-09-07）

本書の指摘は監査時点の履歴として残す。P0-01〜02、P1-01〜08、P2-01〜02はローカル実装で是正し、完成契約C-01〜C-22へ対応付けた。

- 最終結果: 5 evidence source、13 rule、2 scenario、12 gateがすべてpassed。
- visual: macOS/Linux別の22 baselineを更新なしで比較。
- 汎用性: TODO固有path、evidence ID、port、test pathの共通runner直書きをscanし0件。
- 生成物: 最終実行前後の`git status`差分0件。
- 詳細証跡: [../verification/2026-09-07-completion-evidence.md](../verification/2026-09-07-completion-evidence.md)

GitHub Actionsは監査後の[run 34070990440](https://github.com/schro-cat-dev/torisetsu/actions/runs/34070990440)でUbuntu上の成功を確認した。required check設定、Safari/Firefox、実機、screen reader手動確認は未実施であり、本監査のローカル是正完了とは分ける。

監査日: 2026-09-07

## 結論

現状は、分離設計の試作と個別checkの実行までは成立しているが、汎用UI品質ハーネスとしては未完了です。

- P0: 2件
- P1: 8件
- P2: 2件
- missing-test: 5件

最重要の問題は、profileに書いたruleと実ブラウザ結果を結合する最終判定がないことです。`blocking: true` のruleに証跡がなくても、profile整合性checkとbrowser checkがそれぞれ `status: ok` になります。

汎用性も合格ではありません。DOM evidenceのIDを `domSnapshot` から別名へ変えただけで全DOM ruleがskipされ、そのまま `status: ok` になる反例を実行で確認しました。

## 検証条件

| 項目 | 内容 |
|---|---|
| worktree | `/Users/yutoseki/develop/work/torisetsu` |
| branch | `main` |
| HEAD | `b36c0046ce05e3e750f9e3fbe5c61e0fe889ead9` |
| 開始時刻 | 2026-09-07 07:39:19 JST |
| 対象 | `internal_refs/harness_arch/ui_quality_harness/`、`harness_lab/todo_frontend/tooling/quality-harness/`、`.github/workflows/ui-quality-harness.yml`、`.git/hooks/pre-push` |
| 状態 | 対象を含む未コミット変更が多数あるため、HEADとの差分ではなく監査開始時のworktreeを対象にした |
| 特殊操作 | サーバー起動、外部接続、browser再実行、git状態変更は行っていない |
| 並列監査 | 独立subagent機能は使えないため、単一agentで要求、設計、契約、runner、接続、証跡の観点を分けて監査した |

## 確認した事実

### 成立していること

- UI固有のselector、route、npm command、portは、主にproject configと外部tool specへ分離されている。
- `run-ui-quality-profile.mjs`、`run-ui-dom-snapshot.mjs`、`run-ui-judgment-review.mjs`、`ui-dom-snapshot-core.mjs` は構文checkを通過した。
- profile、DOM、judgmentの既存正常fixtureは実行できる。
- TODO側の既存browser runではE2E、axe、layout、DOM capture、visual comparisonがpassした記録がある。
- `.git/hooks/pre-push` は存在し、実行権限が付いている。

### 完了根拠にできないこと

- profile runnerの `status: ok` は、adapter実行やUI品質合格を意味しない。
- browser harnessの `status: ok` は、profileのgate/rule/scenarioとの対応を検査していない。
- live DOM snapshotは生成されるが、CIのbrowser profile内では `run-ui-dom-snapshot.mjs` に渡されない。
- TODO用judgment reviewは作成・実行されていない。
- GitHub ActionsはまだUbuntu上で実走確認されていない。

## 元要求との対応

| 要求 | 判定 | 根拠 |
|---|---|---|
| 他と混同しない分離ディレクトリ | 充足 | `internal_refs/harness_arch/ui_quality_harness/` に分離済み |
| docs + JSON + toolをconfigで連携 | 部分充足 | 構造はあるが、adapter結果をruleへ戻す連携がない |
| runnerへ対象固有path・文言・しきい値を置かない | 不充足 | `run-ui-dom-snapshot.mjs:184` にprofile固有ID `domSnapshot` が直書き |
| 新しい対象をconfig追加で扱う | 不充足 | live captureにはTODO固有Playwright specが必要で、evidence ID変更でも動作が崩れる |
| 最初の5観点を土台として保つ | 不充足 | `interactionPattern` と `layoutConsistency` が実装profileから消えている |
| 情報の有無・過多・不足を見る | 部分充足 | 必須情報と最大量は見るが、少なすぎる量の下限ruleがない |
| 情報構成・配置を見る | 部分充足 | DOM順と最初の要素だけによる一次検査に留まる |
| 操作flowを細かく確認する | 不充足 | main CRUD 1本だけ実行。error/retry/cancel/loading等はprofile宣言だけ |
| CIとpre-pushへ接続 | 部分充足 | ファイルはあるがCI baselineがmacOS専用。pre-pushはsample fixture中心 |
| 全画面visual regression | 不充足 | `/todos` の初期一覧だけ。全route・全stateではない |

## 指摘チェックリスト

### P0

#### P0-01 最終品質判定が存在せず、blocking ruleが未検証でもOKになる

- 場所:
  - `internal_refs/harness_arch/ui_quality_harness/tools/run-ui-quality-profile.mjs:301`
  - `internal_refs/harness_arch/ui_quality_harness/tools/run-ui-quality-profile.mjs:181`
  - `harness_lab/todo_frontend/tooling/quality-harness/profiles/browser-quality.json:7`
  - `internal_refs/harness_arch/ui_quality_harness/project_profiles/todo_frontend/todo-frontend.ui-quality-profile.json:159`
- 事実:
  - profile runnerは構造と参照を検査するだけでadapterを実行しない。
  - `gate.blocking` はbooleanかだけ確認され、最終status計算に使われない。
  - browser profileはDOM snapshotを生成するが、その後にlive snapshotのrule評価を呼ばない。
  - `todo-state-recovery` はblocking/errorだが、対応するerror/retry testがPlaywright specにない。
- 影響: UI品質の必須項目が未検証でも、CIと結果JSONを成功表示できる。
- 変更後: profile → adapter実行 → canonical resultへ正規化 → rule/scenarioへ証跡割当 → blocking gate集約、を1つのorchestratorで行う。
- 受け入れ条件:
  - blocking ruleに結果がない、全件skip、scenario未実行のいずれかでexit 1になる。
  - `todo-error-recovery-flow` の証跡がなければ `stateAndRecovery` がfailedになる。
  - 1つの最終resultから、全gate、全rule、証跡source、skip理由を追える。

#### P0-02 CIのvisual baselineがUbuntuで見つからない

- 場所:
  - `.github/workflows/ui-quality-harness.yml:11`
  - `harness_lab/todo_frontend/tooling/quality-harness/external-tools/playwright/tests/todo-visual-regression.spec.ts-snapshots/`
  - `harness_lab/todo_frontend/node_modules/playwright/lib/index.js:218`
- 事実:
  - workflowは `ubuntu-latest` を使う。
  - baselineは `*-chromium-darwin.png` の2枚だけで、`*-chromium-linux.png` は0枚。
  - 現在のPlaywright 1.55.1は `testInfo.snapshotSuffix = process.platform` とする。
- 影響: GitHub ActionsではLinux用baselineを探すため、visual checkがmissing snapshotで失敗する。
- 変更後: CIと同じLinux環境でbaselineを生成して保存する。font、browser version、viewportも固定する。
- 受け入れ条件: `ubuntu-latest` または同一containerで `npm run check:browser-visual` がbaseline更新なしでpassする。
- 未実測: GitHub Actions自体はこの監査では実行していない。結論はworkflow、baseline名、Playwright実装の静的照合による。

### P1

#### P1-01 JSON Schemaが実行時に使われていない

- 場所:
  - `internal_refs/harness_arch/ui_quality_harness/contracts/ui-quality-profile.schema.json:6`
  - `internal_refs/harness_arch/ui_quality_harness/tools/run-ui-quality-profile.mjs:140`
  - `internal_refs/harness_arch/ui_quality_harness/tools/run-ui-dom-snapshot.mjs:197`
- 反例: profileへSchema禁止の未知field `unexpected` を追加してもexit 0、`status: ok`。snapshotへ同じ未知fieldを追加してもexit 0。
- 影響: Schemaを契約の正本として変更してもrunnerの受理条件へ反映されない。
- 変更後: profile、adapter config、capture config、snapshot、review、全resultを共通Schema validatorで入出力時に検査する。
- 受け入れ条件: unknown field、必須欠落、型違い、enum外、空配列のnegative fixtureがすべてexit 1になる。

#### P1-02 `domSnapshot` ID直書きとskip成功により汎用性が崩れる

- 場所: `internal_refs/harness_arch/ui_quality_harness/tools/run-ui-dom-snapshot.mjs:184`
- 反例: evidence source IDと全参照を `renamedDom` に整合させたprofileでは、5 ruleすべて `skipped` になりながらexit 0、`status: ok`。
- 影響: 意味が同じconfigでもID名を変えるだけで検査されない。新規対象追加時のengine diffゼロ条件を満たさない。
- 変更後: 起動時に対象adapter/evidence sourceを引数またはkind/capabilityで解決し、対象ruleが0件または全skipなら失敗させる。
- 受け入れ条件: evidence IDを任意名へ変更しても同じ検査結果になり、存在しないsource指定ではexit 1になる。

#### P1-03 assertion別params契約がなく、空設定がpassする

- 場所:
  - `internal_refs/harness_arch/ui_quality_harness/contracts/ui-quality-profile.schema.json:150`
  - `internal_refs/harness_arch/ui_quality_harness/tools/run-ui-dom-snapshot.mjs:133`
  - `internal_refs/harness_arch/ui_quality_harness/tools/run-ui-dom-snapshot.mjs:155`
- 反例: `related-actions-near-target.params` を `{}` にしても `related actions are close enough` としてpassする。
- 現行TODO例: ruleは `compareBy: ["role", "variant"]` だが、capture configのexpectedは `visible` だけなので比較が0件のままcomponent consistencyがpassする。
- 変更後: assertionごとに `oneOf` で必須params、非空配列、数値範囲、参照IDを定義する。比較keyがexpectedにない場合はfailする。
- 受け入れ条件: `{}`、空配列、負数、unknown ref、expected欠落がnegative fixtureで拒否される。

#### P1-04 元の土台観点を保てておらず、情報不足量も定義できない

- 場所: `internal_refs/harness_arch/ui_quality_harness/design.md:27`
- 事実: 元の5観点のうち `interactionPattern` と `layoutConsistency` がgate一覧にない。`interactionFlow` は利用者の手順、`interactionPattern` はbutton/dialog/form等の期待動作であり同じではない。
- 事実: information density checkは最大文字数と最大primary action数だけで、最小説明量、空label、情報不足を扱わない。
- 変更後: 元の5観点を残し、追加7観点を別軸として扱う。最低構成は12 gateとし、responsiveは各gateへかけるscenario dimensionにする。
- 受け入れ条件: 各gateにruleまたは理由付きwaiverがあり、`minVisibleTextLength` 等の不足側caseを判定できる。

#### P1-05 state/recoveryとa11yの宣言が実testより強い

- 場所:
  - `internal_refs/harness_arch/ui_quality_harness/project_profiles/todo_frontend/todo-frontend.ui-quality-profile.json:159`
  - `internal_refs/harness_arch/ui_quality_harness/project_profiles/todo_frontend/todo-frontend.ui-quality-profile.json:172`
  - `harness_lab/todo_frontend/tooling/quality-harness/external-tools/playwright/tests/todo-a11y.spec.ts:4`
- 事実: profileはempty/error/success/disabled/cancel/retryとkeyboard/focus/dialogCloseを要求する。実testはhappy-path CRUD 1本と、color contrastを除外したaxe scan 1本である。
- 影響: testが証明していない項目を、profile上は自動確認済みのように見せる。
- 変更後: loading、empty、API error、retry、cancel、二重submit、keyboard-only、focus移動、Escape closeを個別caseへ分ける。
- 受け入れ条件: 各required state/actionにtest IDと結果artifactが1対1で紐づく。証跡なしはfailedまたは期限付きwaiverになる。

#### P1-06 visual regressionは全画面・全状態ではなく、2%の根拠もない

- 場所:
  - `harness_lab/todo_frontend/src/App.tsx:7`
  - `harness_lab/todo_frontend/tooling/quality-harness/external-tools/playwright/tests/todo-visual-regression.spec.ts:3`
  - `harness_lab/todo_frontend/tooling/quality-harness/profiles/browser-quality.json:40`
- 事実: routeは `/todos/new`、completed、detail、edit等があるが、visual testは `/todos` 初期一覧だけを2 viewportで撮る。profile自身も全状態・全画面ではないと記載する。
- しきい値: `maxDiffPixelRatio <= 0.02`。現baselineではmobile 846,750px中16,935px、desktop 1,585,920px中31,718pxの差を許す。根拠、近傍test、許容/拒否例はない。
- 変更後: route/state manifestで対象を列挙し、一覧、空、作成modal、編集modal、詳細展開、完了一覧、errorを撮る。しきい値はconfigへ置き、欠陥fixtureで校正する。
- 受け入れ条件: manifestの全stateにbaselineがあり、1 state欠落でfailする。0.019/0.020/0.021相当の境界caseと、重要control消失の拒否caseがある。

#### P1-07 DOM計測値が評価概念と一致していない

- 場所:
  - `internal_refs/harness_arch/ui_quality_harness/tools/ui-dom-snapshot-core.mjs:25`
  - `internal_refs/harness_arch/ui_quality_harness/tools/ui-dom-snapshot-core.mjs:43`
  - `internal_refs/harness_arch/ui_quality_harness/tools/run-ui-dom-snapshot.mjs:49`
  - `harness_lab/todo_frontend/tooling/quality-harness/external-tools/playwright/tests/todo-layout-snapshot.spec.ts:24`
- 事実:
  - `textContent` は子孫の非表示文字も含み得るため、visible text量と一致しない。
  - `querySelector` の最初の1要素だけを情報・配置評価に使う。
  - information orderはDOM順であり、CSS上の視覚順・強調度ではない。
  - 共通DOM adapterはbox間の最短gap、TODO layout testはcenter間距離を使い、同じ「近さ」で式が異なる。
- 変更後: `domOrder`、`visualOrder`、`edgeGapPx`、`centerDistancePx` を別metricにし、対象集合とvisible text nodeの定義を固定する。
- 受け入れ条件: hidden text、CSS order、複数item、0px接触、しきい値直前/同値/直後のbrowser fixtureが期待どおりになる。

#### P1-08 完了表示と証跡運用が実態に合わない

- 場所:
  - `internal_refs/harness_arch/ui_quality_harness/progress-checklist.md:41`
  - `internal_refs/harness_arch/ui_quality_harness/progress-checklist.md:47`
  - `internal_refs/harness_arch/ui_quality_harness/progress-checklist.md:63`
  - `internal_refs/harness_arch/ui_quality_harness/results/browser-quality.latest.evidence.json:1`
  - `internal_refs/harness_arch/ui_quality_harness/runbooks/pre-push-hook.sample.sh:7`
- 事実:
  - 監査前のchecklistは対象項目を「完了」とする一方、同じ表にSchema runner組込みと実reviewが後続とあった。現在は監査前の判定履歴として分離し、完了判定を取り消している。
  - `browser-quality.latest.evidence.json` を生成するコード参照は0件で、最新browser runとも時刻が一致しない。
  - pre-pushは動的な `checkedAt` を含むpush対象候補のresultファイルを毎回上書きする。
  - `harness_runs/*/summary.md` はrunごとに未追跡fileを増やす設定である。
- 変更後: stable fixtureとgenerated run artifactを分離し、generated resultはgitignoreまたはCI artifactへ置く。evidenceにはcommit、profile hash、input hash、producer commandを持たせる。
- 受け入れ条件: pre-push後に `git status --short` が増えず、evidenceが1 commandで再生成でき、記録したinput identityと一致する。

### P2

#### P2-01 adapter/result契約が複数系統に分かれ、正規化層がない

- 場所:
  - `internal_refs/harness_arch/ui_quality_harness/project_profiles/todo_frontend/adapters/todo-browser-flow.tool.json:26`
  - `internal_refs/harness_arch/ui_quality_harness/contracts/ui-quality-adapter-result.schema.json:1`
  - `harness_lab/todo_frontend/tooling/quality-harness/checks/run-external-tool-spec.mjs:92`
- 事実: sample adapterは `ui-quality-adapter-result.v1`、TODO adapterは `external-tool-check-result.v1`、手作業evidenceは `ui-quality-browser-evidence.v1` を使う。相互変換するproducerはない。
- 変更後: 外部tool固有resultを1つのcanonical adapter resultへ変換するnormalizerを置く。
- 受け入れ条件: Playwright、axe、DOM、judgmentの全結果が同じ必須fieldで最終aggregatorへ入る。

#### P2-02 共通runnerの失敗時・依存・path境界が弱い

- 場所:
  - `harness_lab/todo_frontend/tooling/quality-harness/run-quality-harness.mjs:14`
  - `harness_lab/todo_frontend/tooling/quality-harness/run-quality-harness.mjs:130`
  - `harness_lab/todo_frontend/tooling/quality-harness/checks/run-external-tool-spec.mjs:71`
- 事実: profile load errorの原因をtop-level catchが表示しない。`requires` は定義順だけを確認し、runtimeで依存結果を見ない。restore/result pathはroot内containmentを検査しない。
- 現行影響: browser profileは `stopOnFailure: true` のため、`requires` のruntime欠陥は今の経路では表面化しない。
- 変更後: error cause表示、dependency result check、realpath/containment、restoreのfinally/signal方針を追加する。
- 受け入れ条件: 不正profileの具体error、依存失敗時skip、`../` path拒否、tool失敗後restoreをtestで確認できる。

## missing-test

| ID | 不足 | 追加する最小test |
|---|---|---|
| MT-01 | Schema negative case | unknown、missing、wrong type、enum外、空配列 |
| MT-02 | 汎用性の差し替え | evidence ID変更、新profile追加でcore diffゼロ |
| MT-03 | assertionとしきい値境界 | params欠落、N-1/N/N+1、空対象、全skip |
| MT-04 | CI platform | Linux baseline、font/browser pin、baseline欠落 |
| MT-05 | UI state/flow/a11y | loading、empty、error、retry、cancel、keyboard、focus、Escape |

## しきい値監査

| rule | operator / 値 | scope | 根拠 | 判定 |
|---|---|---|---|---|
| visible text | `> 160` でwarning | TODO item | 記載なし | 未確定 |
| primary action count | `> 3` でwarning | TODO item | 記載なし | 未確定 |
| related action distance | DOM `> 260px`、layout center `> 360px` | first TODO item | 記載なし。計算式も不一致 | 不整合 |
| visual diff | `> 0.02` でfail | `/todos` full page | 記載なし | 未確定 |

null、欠損、丸めは契約化されていない。境界値近傍testもないため、現行値を汎用defaultとして扱わない。

## 改善案

### A案: 1つのprofile orchestratorへ統合する（推奨）

- profileがadapter configとrule/scenarioを所有する。
- 外部tool結果はnormalizerで `ui-quality-adapter-result.v1` へ統一する。
- orchestratorがcoverage不足、skip、blocking、warningを集約する。
- project追加はprofile、capture config、tool spec、baseline/state manifestの追加だけにする。

良い点: 元要求の `docs + JSON + tool + config連携` と、engine diffゼロをそのまま受け入れ条件にできる。

### B案: 現在の2つのharnessを維持してbridgeだけ足す

- TODO側browser harnessはそのまま残す。
- `external-tool-check-result.v1` をUI ruleへ割り当てるbridge manifestを追加する。
- 最終判定だけUI harness側で行う。

良い点: 変更量は少ない。欠点は契約と実行入口が二重のまま残り、長期的に追跡コストが高い。

## ROI順の修正順

1. P0-01: 最終aggregatorとmissing evidence failを作る。
2. P0-02: Linux baselineを作り、CI実走を確認する。
3. P1-01〜03: Schema実検証、ID直書き除去、assertion別params契約を入れる。
4. P1-05: state/recoveryとa11yの証跡を実testへ合わせる。
5. P1-04、06、07: 観点、全state visual、DOM metricを補う。
6. P1-08、P2: generated artifactと共通runnerの運用を整える。

## 他エージェントへ渡す場合の依頼単位

### Task 1: canonical resultとaggregator

- 対象: `internal_refs/harness_arch/ui_quality_harness/tools/` と `contracts/`
- 内容: adapter結果をruleへ割り当て、blocking/missing/skipを最終判定する。
- 禁止: TODO path、evidence ID、tool CLI pathをrunnerへ直書きしない。
- 受け入れ条件: P0-01、P1-02のnegative fixtureが期待どおりfailする。

### Task 2: Schema実検証とassertion contract

- 対象: 全`*.schema.json`、profile/DOM/judgment runner。
- 内容: 入出力Schema validationとassertion別params schemaを追加する。
- 依存: Task 1のcanonical result形を先に確定する。
- 受け入れ条件: MT-01、MT-03がpassする。

### Task 3: CI/visual matrix

- 対象: workflow、visual spec、baseline/state manifest。
- 内容: Linux baselineと全route/state coverageを作る。
- 受け入れ条件: Ubuntu上のbrowser visualとmanifest completenessがpassする。

## 実行証跡

| command / 方法 | 期待結果 | 実結果 | Level |
|---|---|---|---|
| `node --check` 4 runner | syntax error 0 | 4/4 pass | L1 |
| 全対象JSONへ `jq empty` | parse error 0 | pass | L1 |
| 正常TODO profile runner | 構造check pass | exit 0、reviewRequired 2件 | L2 |
| live DOM result評価 | warningを保持 | exit 0、1 warning | L2 |
| profileへ未知field追加 | Schemaどおりなら拒否 | exit 0、誤ってaccept | L2 |
| DOM evidence ID変更 | 同じ意味なら同じ結果 | 全5件skip、exit 0 | L2 |
| relation paramsを `{}` | 拒否 | passed、exit 0 | L2 |
| snapshotへ未知field追加 | Schemaどおりなら拒否 | exit 0、誤ってaccept | L2 |
| evidence名だけを満たすjudgment | 実証跡なしならpass不可 | 2件passed、exit 0 | L2 |
| `npm run check:harness-genericity` | coreの対象固有値も検出 | passしたが監査対象coreをscanしていない | L2 |
| baseline名とPlaywright実装照合 | Ubuntu用suffixが存在 | Linux baseline 0件 | L1 |
| `git diff --check` | whitespace error 0 | pass | L1 |

## 未確認範囲

- GitHub Actionsの実run。
- 今回の監査中のbrowser再実行。
- Safari、Firefox、mobile実機、screen reader。
- 外部UI標準資料の再調査。
- TODOアプリ自体の全機能・security・performance監査。

既存のbrowser pass記録は、現在のmacOSローカル環境で個別specが動いた証拠としてのみ扱う。汎用性、profile coverage、GitHub Actions成功の証拠には使わない。
