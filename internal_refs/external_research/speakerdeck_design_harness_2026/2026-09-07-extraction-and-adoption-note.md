# SpeakerDeck「デザインハーネス」情報抽出と採用メモ

作成日: 2026-09-07

## 参照元

- SpeakerDeck: [デザインハーネス 〜AIが生成する"デザイン"の妥当性を、誰がどう担保するのか〜 / PdEConf2026 Design Harness](https://speakerdeck.com/kgsi/pdeconf2026-design-harness)
- PDF: `https://files.speakerdeck.com/presentations/817a8cc87ec64e2099f655313dfa4a93/pdeconf-2026-design-harness.pdf`
- 公開日表示: 2026-09-05
- 確認日: 2026-09-07

## 抽出方法

1. SpeakerDeckのHTMLを取得し、PDFリンクと33枚のスライド画像リンクを確認した。
2. PDFを `/private/tmp/pdeconf-2026-design-harness.pdf` に一時保存した。
3. `pdfinfo` で33ページ、1920 x 1080 pt、暗号化なしを確認した。
4. `pdftotext -layout` は実質空だったため、画像OCRへ切り替えた。
5. `pdftoppm -jpeg -r 160` で各ページを画像化した。
6. `tesseract` に一時配置した `jpn.traineddata` を指定し、`jpn+eng` でOCRした。

## 抽出精度

- テキスト主体のページは要点抽出できた。
- スクリーンショット主体のページはOCRノイズが多い。
- OCR全文は保存しない。著作権とノイズ削減のため、確認できた要点だけを記録する。

## 資料から確認できた要点

| 項目 | 要点 |
|---|---|
| 問題設定 | AIで生成が並列化される一方、レビューやチェックが直列化し、ボトルネックが実装から判断へ移る。 |
| 判断基準の問題 | 誰がOKを出すか、妥当の定義がどこにあるかが曖昧だと、見る主体によって答えが変わる。 |
| 仕組み化の方向 | 個人の頭の中にある判断基準だけに頼らず、仕組みで扱える形にする。 |
| テストとの対応 | コードの正しさをテストで担保するように、生成デザインの妥当性も検証する仕組みを持つ。 |
| デザインハーネスの定義 | デザインの判断基準、文脈、検証を、AIが読めて、使えて、検証できる状態にする考え方。 |
| 4層モデル | 制約、コンテキスト、検証、評価/フィードバックの4層で扱う。 |
| 制約 | token、component契約、page構造、禁止事項など、生成に効く型を置く。 |
| コンテキスト | product目的、対象ユーザー、業務flow、扱う状態、既存画面exampleなどを必要分だけ渡す。 |
| 検証 | design systemとのずれ、状態不足、accessibility、text overflowなどをdesign lint/CIとして扱う。 |
| 評価/フィードバック | 一度のレビュー結果を、次回も使える基準へ変える。 |
| 効きやすい対象 | 定型画面、既存プロダクトの拡張、複数チームの並列開発。 |
| 効きにくい対象 | 正解がまだ決まっていない0から1の探索。探索には別の型が必要。 |

## このリポジトリで採用する補正

資料内には、AIが速く生成しても何を良しとするかを決めるのは人、という趣旨の表現がある。
このリポジトリでは、そのまま `人 > AI` の上下関係として採用しない。

このリポジトリの前提:

- AIと人は、等価な判断主体として扱う。
- 違いは、仮想的か物理的か、モデル規模、観測手段、権限、責任境界、証跡レベルの差として扱う。
- `誰が判断するか` は、人かAIかではなく、どの判断主体がどの証跡、権限、契約で判断したかとして記録する。
- AIの判断も、人の判断も、根拠、入力、制約、未確認点がなければ完成判断にしない。

言い換え:

| 元資料から受け取れる表現 | このリポジトリでの採用表現 |
|---|---|
| 人が判断する | 採用権限を持つ判断主体が、証跡と契約に基づいて判断する |
| AIは判断しない | AIも判断できるが、判断範囲、根拠、confidence、未確認点を明示する |
| 人が見るべき対象を絞る | 追加判断が必要な対象を絞る。担当は人でもAIでもよい |
| 人の経験を組織資産にする | 判断主体の経験、レビュー結果、失敗例を再利用可能な制約や検証条件にする |

## ハーネス化候補

| 層 | config / policyに置くもの | runnerがすること |
|---|---|---|
| 制約 | token、component、layout、禁止事項、許可variant | 生成物が制約に合うか検査する |
| コンテキスト | product目的、対象ユーザー、業務flow、既存画面ID | 生成やレビュー時に必要分だけ参照させる |
| 検証 | accessibility、overflow、flow、状態不足、component契約 | DOM、screenshot、Storybook、lint、E2Eで確認する |
| 評価/フィードバック | findings、rule候補、採用/不採用理由、次回制約 | レビュー結果を次回使える形式に変換する |

## policy例

```json
{
  "schemaVersion": "design-harness-source-gate.v1",
  "source": {
    "title": "PdEConf2026 Design Harness",
    "url": "https://speakerdeck.com/kgsi/pdeconf2026-design-harness",
    "checkedAt": "2026-09-07"
  },
  "actorModel": {
    "principle": "human_and_ai_are_peer_judgment_actors",
    "doNotUseHierarchy": true,
    "requiredEvidenceForJudgment": [
      "input",
      "constraint",
      "checkResult",
      "unverifiedItems",
      "actorAuthority"
    ]
  },
  "layers": [
    "constraints",
    "context",
    "verification",
    "evaluationFeedback"
  ],
  "statusValues": [
    "pass",
    "fail",
    "needs_judgment"
  ]
}
```

## 使う時の注意

- 資料の内容は参考にするが、`人が上位でAIが下位` という構造にはしない。
- `needs_judgment` は、人間専用の待ち状態ではない。AI、人、別AI、チームレビューのどれでも担当できる。
- 判断主体を記録する時は、`actorType` だけでなく、`authority`、`evidenceLevel`、`confidence`、`unverifiedItems` を一緒に残す。
- 制約に書けない感覚的な違和感は、まず観察メモとして残す。検証に使うなら、機械で見られる条件へ変換する。

## 残リスク

- OCR結果は完全ではない。特にスクリーンショット主体ページはノイズが多い。
- このメモは要点抽出であり、資料全文の代替ではない。
- 資料の意図そのものを変更するものではない。このリポジトリへ採用する時の補正を明示したもの。
