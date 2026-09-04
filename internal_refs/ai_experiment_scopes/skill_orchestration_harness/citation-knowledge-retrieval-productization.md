# 独自引用・ナレッジ取得ツール 実用化メモ

作成日: 2026-09-04

## 結論

`Qwen/Qwen3-0.6B` を、長い構造化アウトプットを作るLLM部品として採用しない。

理由は、出力品質に対して時間と計算コストが見合わないため。

次は、小型LLMに無理に生成させるのではなく、独自に蓄積した引用、言い回し、判断基準、OK/NG例、証跡を引っ張ってくるツールを実用化する。

## 判断の元になった実測

| 対象 | 実測 | 判断 |
|---|---|---|
| `rakugo.learning.plan.scored.001` v3 | 約13分48秒、1600 token上限到達、評価基準途中切れ | 長い構造化promptを一発で任せるには弱い |
| `rakugo.learning.case.practice.001` v4 | 約14分7秒、2000 token上限到達、同文反復、ケース4途中切れ | ケース練習に絞っても意味保持が弱い |

ユーザー判断:

- 現時点の出力品質では、システムに組み込む価値は低い。
- 出力品質に対して、体感では数百倍くらいコストがかかっている。
- 独自に引用やナレッジを蓄積し、必要なものを引っ張ってきた方がよい。

## 実用化する方向

| 方針 | 内容 |
|---|---|
| 蓄積する | 良い言い回し、判断基準、NG/OK例、失敗例、根拠、採用済みアウトプットを保存する |
| 探す | タスク、スコープ、評価軸、タグ、過去の似た失敗から候補を引く |
| 渡す | AIへ全部読ませず、今回必要な引用とナレッジだけ渡す |
| 作る | AIはゼロから生成するのではなく、渡された材料を使って整形、比較、抜け漏れ確認をする |
| 検証する | 出力に使った引用ID、根拠、採用理由、未使用理由を残す |

## 最小データ単位

```json
{
  "schemaVersion": "citation-knowledge-item.v1",
  "knowledgeId": "knowledge-rakugo-case-practice-001",
  "type": "phrase_example",
  "scope": ["conversation", "practice", "rakugo-transfer"],
  "source": {
    "kind": "user_created",
    "path": "internal_refs/...",
    "quote": "相手の発言を1語拾い、「つまり〇〇ってことですね」と返す練習を10回録音する。"
  },
  "meaning": "相手の言葉を拾って反応する練習例",
  "useWhen": ["反応の良さを練習する", "会話の受け方を具体化する"],
  "doNotUseWhen": ["笑いを作る練習だけをしたい"],
  "quality": {
    "score": 4,
    "reason": "具体行動、回数、記録方法がある"
  },
  "tags": ["reaction", "conversation", "recording", "solo-practice"],
  "security": {
    "visibility": "private",
    "externalSendAllowed": false
  }
}
```

## 最小ツール案

| tool | 入力 | 出力 | 役割 |
|---|---|---|---|
| `index-knowledge` | knowledge item JSON/Markdown | catalog JSON | 蓄積した知識を一覧化する |
| `select-knowledge` | task scope、tags、必要数 | selected knowledge set | 今回使う材料だけ選ぶ |
| `render-context-pack` | selected knowledge set | AIへ渡す短いcontext | AIへ渡す量を抑える |
| `check-output-grounding` | output、selected knowledge set | 使用/未使用/根拠不足 | 出力が材料に基づいているか見る |

## 完了条件

- [ ] `citation-knowledge-item.v1` のschemaを決める。
- [ ] 5件以上の手作りナレッジを登録する。
- [ ] tag、scope、typeで候補を絞れる。
- [ ] AIへ渡すcontext packを作れる。
- [ ] 出力がどのknowledgeIdを使ったか記録できる。
- [ ] 外部送信禁止のknowledgeを弾ける。
- [ ] 小型LLM生成ではなく、引用取得方式で同じ落語ケース練習を再構成できる。

## 関連

- [Qwen3 0.6B Colab CPU Summary](../benchmark_threshold_design/experiments/oss_llm_colab/2026-09-04-qwen3-0-6b-colab-cpu-summary.md)
- [小型OSS LLMの採用判断は品質対コストで見る](../ai_collaboration_cheatsheet/knowledge/2026-09-04-small-oss-llm-cost-quality-nonadoption.md)
- [チーム一元化ハーネス詳細設計](team-centralized-harness-system-design.md)
