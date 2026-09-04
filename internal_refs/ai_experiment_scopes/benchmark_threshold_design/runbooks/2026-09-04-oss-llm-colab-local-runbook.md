# OSS LLM Colab / Local Trial Runbook

作成日: 2026-09-04 JST

## 目的

Claude、Codex、OpenAI APIへの依存を切り、OSS / open-weight modelを自分の実行環境で動かせるか確認する。

このrunbookで見るもの:

- 推論挙動: 指示追従、推論、JSON出力、tool use風の出力。
- 必要リソース: CPU、RAM、GPU/VRAM、disk。
- パフォーマンス: 初回download時間、初回応答時間、tokens/sec、失敗内容。
- 接続方法: local OpenAI-compatible APIとして既存ハーネスへ差し替えられるか。

## 結論

最初は次の順番で試す。

1. Colab無料CPUで `Qwen/Qwen3-0.6B` を短く動かす。
2. ローカルで `Ollama` を入れ、`qwen3:0.6b` または `qwen3:1.7b` を動かす。
3. 同じpromptをColabとローカルで実行し、出力と速度を比較する。
4. ローカルのOpenAI-compatible endpointへcurlで投げる。
5. 余裕があれば `qwen3:4b`、`qwen3:8b`、`gpt-oss:20b` へ広げる。

いきなり `gpt-oss:20b` や `qwen3-coder:30b` から始めない。重く、無料ColabやCPUでは失敗原因がモデル品質なのかリソース不足なのか分かりにくい。

## 前提

| 項目 | 前提 |
|---|---|
| 公開/非公開 | private情報、secret、顧客情報、未公開tool名は入れない |
| Colab | 無料枠はリソース保証なし。長時間常駐やWeb UI中心の利用は避ける |
| ローカル | まず小型モデルで成功確認する |
| API key | 不要。ローカルAPIのdummy keyだけ使う |
| 記録 | 成功/失敗の両方を残す |

## 問題が発生した場合の対応

Colabで依存関係、model load、OOM、runtime切断が起きた場合は、先にこの表を見る。

| 症状 | 主な原因 | まずやること | 詳細 |
|---|---|---|---|
| `torchvision::nms does not exist` | `torch` / `torchvision` の不整合 | Colabを最初からやり直す | `Colabを最初からやり直す手順` |
| `torchvision requires torch==...` | `torch` だけupgradeされた | Colabを最初からやり直す | `package install失敗時の確認` |
| `torch_dtype is deprecated` | Transformers 5系で古い引数名を使っている | `dtype=` に直す | `モデル読み込みセル` |
| `HF_TOKEN` warning | Hugging Face未認証download | 公開modelの短い試行なら一旦続行 | model downloadが遅い時だけHF tokenを検討 |
| `OutOfMemoryError` | RAM不足 | 小さいmodelに下げる | 0.6Bでも落ちるならColab CPU試行を止める |
| runtimeが切れる | Colab無料枠、idle、重い処理 | 短いcellに分ける | 長時間常駐やWeb UI化はしない |

## Colabを最初からやり直す手順

依存関係が壊れた時は、`Restart runtime` だけではなく、runtime自体を捨ててやり直す。

1. Colab menuで `Runtime` を開く。
2. `Disconnect and delete runtime` を選ぶ。
3. もう一度runtimeへ接続する。
4. `Runtime` -> `Change runtime type` を開く。
5. `Hardware accelerator` を `None` にする。
6. `環境確認セル` を実行する。
7. `package installセル` を実行する。
8. `import確認セル` を実行する。
9. `モデル読み込みセル` を実行する。
10. `疎通用の最小推論セル` を実行する。
11. `超軽量な実運用タスク` を実行する。

やってはいけないこと:

- 古いinstall commandを再実行しない。
- `torch` を `-U` 対象に入れない。
- エラーが出たruntimeで何度もpackageを足し続けない。

正しいinstall command:

```python
!pip -q install -U "transformers>=4.55.0" accelerate psutil
```

import確認セル:

```python
import torch
import transformers
import psutil

print("torch:", torch.__version__)
print("transformers:", transformers.__version__)
print("cuda:", torch.cuda.is_available())
print("ram_gb:", round(psutil.virtual_memory().total / 1024**3, 2))
```

やり直し後のOK:

- `import torch` が通る。
- `import transformers` が通る。
- `cuda: False` でもよい。CPU試行として扱う。
- `torchvision::nms` が出ない。

## 使うモデル

| 優先 | model | 実行場所 | 目安 | 目的 |
|---:|---|---|---|---|
| 5 | `Qwen/Qwen3-0.6B` | Colab CPU / local | 軽い | 最初の疎通確認 |
| 5 | `qwen3:0.6b` | Ollama local | 523MB級 | local API疎通 |
| 4 | `qwen3:1.7b` | Ollama local | 1.4GB級 | 少し強い指示追従 |
| 4 | `qwen3:4b` | Ollama local | 2.5GB級 | 実用寄りの軽量確認 |
| 3 | `qwen3:8b` | Ollama local | 5.2GB級 | 推論品質確認 |
| 2 | `gpt-oss:20b` | local / Colab GPU | 16GB VRAM/unified memory目安 | open-weight reasoning確認 |
| 2 | `qwen3-coder:30b` | local GPU寄り | 24GB VRAM以上目安 | coding agent寄り確認 |

## Colab無料CPUで動かす

### 1. Notebookを作る

1. https://colab.research.google.com/ を開く。
2. `New notebook` を選ぶ。
3. `Runtime` -> `Change runtime type` を開く。
4. `Hardware accelerator` を `None` にする。
5. `Save` を押す。

注意:

- 無料Colabのリソースは固定ではない。
- CPU実行は遅い。
- Web UI、SSH、remote desktop、常駐API server用途にしない。

### 2. 環境確認セル

```python
import os
import platform
import psutil
import sys

print("python:", sys.version)
print("platform:", platform.platform())
print("cpu_count:", os.cpu_count())
print("ram_gb:", round(psutil.virtual_memory().total / 1024**3, 2))
```

期待:

- Python version、CPU数、RAMが表示される。
- ここでRAMが極端に少ない場合は、0.6Bだけ試す。

### 3. package installセル

```python
!pip -q install -U "transformers>=4.55.0" accelerate psutil
```

期待:

- installが完了する。
- Colabに元から入っている `torch` は、最初は上書きしない。
- dependency conflictが出たら、下の `package install失敗時の確認` を見る。

### 3.1 package install失敗時の確認

2026-09-04のColab無料CPUでは、次のcommandで `torch` が大きくupgradeされ、`torchvision` との依存衝突が出た。

実行したcommand:

```python
!pip -q install -U "transformers>=4.55.0" accelerate torch psutil
```

出た内容:

```text
ERROR: pip's dependency resolver does not currently take into account all the packages that are installed.
ipython 7.34.0 requires jedi>=0.16, which is not installed.
torchvision 0.26.0+cpu requires torch==2.11.0, but you have torch 2.14.0 which is incompatible.
```

原因:

- `torch` を `-U` 対象に入れたため、Colabに元から入っている `torch` / `torchvision` の組み合わせを崩した。
- text generationでは `torchvision` は基本的に使わないが、依存関係が壊れた状態なので、後続で別のimportが失敗する可能性がある。
- `ipython` の `jedi` 不足は補完機能寄りの依存であり、今回のLLM推論の主原因ではない。

安定優先の対応:

先頭の `Colabを最初からやり直す手順` に戻る。

入れ直すcommand:

```python
!pip -q install -U "transformers>=4.55.0" accelerate psutil
```

runtime restartを省いて現runtimeで続ける場合の確認:

```python
import torch
import transformers
import psutil

print("torch:", torch.__version__)
print("transformers:", transformers.__version__)
print("cuda:", torch.cuda.is_available())
print("ram_gb:", round(psutil.virtual_memory().total / 1024**3, 2))
```

これは時間を急ぐという意味ではない。依存衝突後でも、現runtimeがまだLLM推論に必要なimportを満たしているかだけを見る確認である。

このimport確認が通るなら、0.6Bの読み込みだけ試してよい。ただし安定性はrestart後より低い。

2026-09-04の確認結果:

```text
torch: 2.14.0+cu130
transformers: 5.16.1
cuda: False
ram_gb: 12.67
```

判断:

- `torch`、`transformers`、`psutil` のimportは通っている。
- `cuda: False` なのでGPUは使えていない。以降はCPU推論として扱う。
- 0.6Bの読み込み確認へ進んでよい。
- ただし `torch` / `torchvision` の依存衝突は残っているため、途中でimportやmodel loadが落ちたらruntime restartして修正版install commandからやり直す。

判断:

| 状態 | 次 |
|---|---|
| import確認が通る | そのまま `Qwen/Qwen3-0.6B` の読み込みへ進む |
| import確認で落ちる | `Disconnect and delete runtime` 後、`torch` を含めないinstall commandでやり直す |
| `torchvision` だけの警告 | 今回はtext generationなので一旦無視可 |
| OOMが出る | `Disconnect and delete runtime` 後、0.6Bより小さい候補を検討 |

### 4. モデル読み込みセル

```python
import time
import torch
import psutil
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_ID = "Qwen/Qwen3-0.6B"

started = time.perf_counter()
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    dtype=torch.float32,
    device_map="cpu",
)
load_seconds = time.perf_counter() - started

print({
    "model": MODEL_ID,
    "device": "cpu",
    "load_seconds": round(load_seconds, 2),
    "ram_used_gb": round(psutil.Process().memory_info().rss / 1024**3, 2),
})
```

失敗時:

| 症状 | 対応 |
|---|---|
| `OutOfMemoryError` | runtime restart後、より小さいmodelに下げる |
| downloadが遅い | 一度待つ。途中で切れたらruntime restart |
| `trust_remote_code` 関連 | まず追加しない。公式model cardを確認して必要な時だけ使う |
| `operator torchvision::nms does not exist` | `torch` / `torchvision` の不整合。`Disconnect and delete runtime` 後、`torch` を含めないinstall commandでやり直す |
| `torch_dtype is deprecated` | `torch_dtype=` ではなく `dtype=` を使う |

`dtype=torch.float32` に修正しても `[transformers] torch_dtype is deprecated` が出る場合:

- ユーザーが書いたcell内の `torch_dtype=` は解消済み。
- warningはTransformers内部、model config、または読み込み済みcache側から出ている可能性がある。
- tracebackで止まらず、最後に `model`、`device`、`load_seconds`、`ram_used_gb` のdictが表示されれば、このwarningだけでは失敗扱いにしない。
- 同時に `RuntimeError` や `ModuleNotFoundError` が出る場合は失敗扱いにし、先頭の `Colabを最初からやり直す手順` に戻る。

### 4.1 モデル読み込み成功結果

実行日: 2026-09-04

ユーザーがColab無料CPUで `モデル読み込みセル` を実行した結果:

```text
Warning: You are sending unauthenticated requests to the HF Hub. Please set a HF_TOKEN to enable higher rate limits and faster downloads.
[transformers] `torch_dtype` is deprecated! Use `dtype` instead!
model.safetensors: reconstructing file: 100%
1.50GB / 1.50GB, 59.1MB/s
Loading weights: 100%
311/311 [00:01<00:00, 317.24it/s]
{'model': 'Qwen/Qwen3-0.6B', 'device': 'cpu', 'load_seconds': 29.27, 'ram_used_gb': 3.08}
```

判断:

- `Qwen/Qwen3-0.6B` のmodel loadは成功。
- `load_seconds` は29.27秒。
- model load後のprocess memoryは3.08GB。
- `cuda: False` のためCPU推論として扱う。
- `HF_TOKEN` warningは未認証downloadの注意であり、この成功結果では致命的ではない。
- `torch_dtype` warningは出ているが、最後にdictが出て正常終了しているため、この結果では失敗扱いにしない。
- 次は `疎通用の最小推論セル` に進む。

### 4.2 モデル読み込み失敗時の実例

2026-09-04のColab無料CPUでは、依存衝突後の現runtimeで `モデル読み込みセル` を実行し、次の出力が出た。

```text
Warning: You are sending unauthenticated requests to the HF Hub. Please set a HF_TOKEN to enable higher rate limits and faster downloads.
[transformers] `torch_dtype` is deprecated! Use `dtype` instead!
RuntimeError: operator torchvision::nms does not exist
ModuleNotFoundError: Could not import module 'Qwen3ForCausalLM'. Are this object's requirements defined correctly?
```

原因:

- HF Hubのwarningは、未認証downloadなのでrate limitや速度が弱いという注意。公開modelの短い試行では致命的ではない。
- `torch_dtype` warningは、Transformers 5系で引数名が古くなったという注意。`dtype` に修正する。
- `torchvision::nms` のRuntimeErrorが主原因。前の `torch` upgradeにより、`torch 2.14.0+cu130` と `torchvision 0.26.0+cpu` の組み合わせが壊れている。
- `Qwen3ForCausalLM` 自体が存在しないというより、import途中で `torchvision` 側が落ちたため、TransformersがQwen3 moduleを読み込めなかった。

推奨対応:

1. Colabで `Runtime` -> `Disconnect and delete runtime` を実行する。
2. Notebookを上から実行し直す。
3. installは次だけにする。

```python
!pip -q install -U "transformers>=4.55.0" accelerate psutil
```

4. model loadは `dtype=torch.float32` の修正版セルを使う。

現runtimeで続けたい場合の暫定対応:

```python
!pip -q uninstall -y torchvision torchaudio
```

その後、`Runtime` -> `Restart runtime` を実行し、import確認からやり直す。

注意:

- 今回はtext-only推論なので `torchvision` は不要。
- ただし暫定対応はColab環境をさらに変えるため、記録を残す実験としては `Disconnect and delete runtime` の方がきれい。

### 5. 疎通用の最小推論セル

このセルは修正版である。

このセルでやること:

- modelが実際に文章を生成できるか見る。
- 出力本文を画面に表示する。
- セル全体時間、case別時間、生成時間、生成token数、tokens/sec、RAM使用量を表示する。
- 3ステップ指定とJSON指定のような、軽い指示を守れるか見る。

このセルでまだ見ないこと:

- 実運用レベルで使えるか。
- tool実行を任せられるか。
- 長い文脈を扱えるか。
- 安定して同じ品質を出せるか。

実運用寄りの確認は、次の `超軽量な実運用タスク` で見る。

前提:

- `モデル読み込みセル` が成功している。
- Notebook上に `tokenizer` と `model` が存在している。
- このセル単体ではmodel downloadやmodel loadはしない。

```python
import json
import time
from datetime import datetime, timezone
import psutil

GENERATION_PRESET = {
    "do_sample": True,
    "temperature": 0.7,
    "top_p": 0.8,
    "top_k": 20,
    "min_p": 0,
}

PROMPTS = [
    {
        "case_id": "reasoning.short.001",
        "prompt": "次の条件を満たす最小の作業計画を3ステップで出してください。条件: 予算0円、30分以内、記録を残す。",
        "max_new_tokens": 320,
    },
    {
        "case_id": "json.contract.001",
        "prompt": '次の形式だけで返してください。{"summary": string, "risks": string[], "next_action": string}',
        "max_new_tokens": 160,
    },
]

RESULTS = []
cell_started_at = datetime.now(timezone.utc).isoformat()
cell_started = time.perf_counter()
model_context_limit = getattr(model.config, "max_position_embeddings", None)

def resolve_effective_max_new_tokens(requested_max_new_tokens, prompt_tokens):
    if model_context_limit is None:
        return requested_max_new_tokens, None
    context_available_new_tokens = max(int(model_context_limit) - int(prompt_tokens), 0)
    return min(requested_max_new_tokens, context_available_new_tokens), context_available_new_tokens

for case in PROMPTS:
    case_started_at = datetime.now(timezone.utc).isoformat()
    case_started = time.perf_counter()
    messages = [{"role": "user", "content": case["prompt"]}]
    requested_max_new_tokens = int(case.get("max_new_tokens", 320))

    prepare_started = time.perf_counter()
    try:
        inputs = tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
            enable_thinking=False,
        )
        thinking_control = "disabled_by_chat_template"
    except TypeError:
        inputs = tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        )
        thinking_control = "chat_template_option_unavailable"
    prepare_elapsed = time.perf_counter() - prepare_started
    prompt_tokens = int(inputs["input_ids"].shape[-1])
    effective_max_new_tokens, context_available_new_tokens = resolve_effective_max_new_tokens(
        requested_max_new_tokens,
        prompt_tokens,
    )

    if effective_max_new_tokens <= 0:
        raise ValueError({
            "case_id": case["case_id"],
            "prompt_tokens": prompt_tokens,
            "model_context_limit": model_context_limit,
            "message": "promptだけでmodel context上限に達しているため生成できない",
        })

    generation_started = time.perf_counter()
    with torch.no_grad():
        try:
            outputs = model.generate(
                **inputs,
                max_new_tokens=effective_max_new_tokens,
                **GENERATION_PRESET,
            )
            generation_preset = GENERATION_PRESET
        except ValueError as error:
            fallback_preset = {
                "do_sample": True,
                "temperature": 0.7,
                "top_p": 0.8,
                "top_k": 20,
            }
            outputs = model.generate(
                **inputs,
                max_new_tokens=effective_max_new_tokens,
                **fallback_preset,
            )
            generation_preset = {
                **fallback_preset,
                "fallback_reason": str(error),
            }
    generation_elapsed = time.perf_counter() - generation_started
    case_total_elapsed = time.perf_counter() - case_started

    new_tokens = outputs.shape[-1] - inputs["input_ids"].shape[-1]
    text = tokenizer.decode(outputs[0][inputs["input_ids"].shape[-1]:], skip_special_tokens=True)
    hit_max_new_tokens = int(new_tokens) >= effective_max_new_tokens

    result = {
        "case_id": case["case_id"],
        "started_at_utc": case_started_at,
        "requested_max_new_tokens": requested_max_new_tokens,
        "effective_max_new_tokens": effective_max_new_tokens,
        "model_context_limit": model_context_limit,
        "context_available_new_tokens": context_available_new_tokens,
        "prepare_seconds": round(prepare_elapsed, 2),
        "generation_seconds": round(generation_elapsed, 2),
        "case_total_seconds": round(case_total_elapsed, 2),
        "prompt_tokens": prompt_tokens,
        "new_tokens": int(new_tokens),
        "remaining_new_token_budget": max(effective_max_new_tokens - int(new_tokens), 0),
        "tokens_per_second": round(new_tokens / generation_elapsed, 2) if generation_elapsed > 0 else None,
        "ram_used_gb": round(psutil.Process().memory_info().rss / 1024**3, 2),
        "thinking_control": thinking_control,
        "generation_preset": generation_preset,
        "hit_max_new_tokens": hit_max_new_tokens,
        "finished_reason_hint": "hit_max_new_tokens_possible_truncation" if hit_max_new_tokens else "stopped_before_limit",
        "output": text,
    }
    RESULTS.append(result)

    print("===")
    print("METRICS")
    print(json.dumps({k: v for k, v in result.items() if k != "output"}, ensure_ascii=False, indent=2))
    print("MODEL OUTPUT")
    print(text)

print("===")
print("ALL RESULTS JSON")
print(json.dumps({
    "cell_started_at_utc": cell_started_at,
    "cell_total_seconds": round(time.perf_counter() - cell_started, 2),
    "default_max_new_tokens": 320,
    "model_context_limit": model_context_limit,
    "results": RESULTS,
}, ensure_ascii=False, indent=2))
```

見ること:

- JSON指定を守るか。
- 余計な説明を混ぜるか。
- 3ステップ指定を守るか。
- CPUで待てる速度か。

出力の見方:

| 表示 | 意味 |
|---|---|
| `METRICS` | 速度、token数、RAM使用量 |
| `MODEL OUTPUT` | モデルが実際に返した本文 |
| `ALL RESULTS JSON` | セル全体時間を含めて、後でログへ貼れる結果一式 |

追加したメタ情報:

| field | 意味 |
|---|---|
| `cell_total_seconds` | このセル全体の所要時間 |
| `prepare_seconds` | chat template適用など、生成前の準備時間 |
| `generation_seconds` | `model.generate(...)` だけの所要時間 |
| `case_total_seconds` | 1 case全体の所要時間 |
| `prompt_tokens` | 入力token数 |
| `requested_max_new_tokens` | caseで指定した希望上限 |
| `effective_max_new_tokens` | model contextを超えないように丸めた実際の上限 |
| `model_context_limit` | `model.config.max_position_embeddings` の値 |
| `context_available_new_tokens` | 現在のpromptで理論上残っている生成token枠 |
| `remaining_new_token_budget` | 残った出力token枠 |
| `hit_max_new_tokens` | `effective_max_new_tokens` 上限まで生成したか |
| `finished_reason_hint` | 打ち切りの可能性を見るための簡易メモ |
| `thinking_control` | `enable_thinking=False` が使えたかを記録する独自メタ情報 |

`thinking_control` はmodelやTransformersの正式な生成パラメータではない。
実際に渡しているのは `tokenizer.apply_chat_template(..., enable_thinking=False)` であり、`thinking_control` はその指定が使えたかをログに残すためのfieldである。

`finished_reason_hint` も正式な終了理由ではなく、このrunbook内の簡易判定である。
`stopped_before_limit` は `effective_max_new_tokens` 未満で止まったという意味だけで、内容が完結した保証ではない。

#### ツール仕様: max_new_tokens

公式仕様として、Transformersの `max_new_tokens` は入力promptを除いた「新しく生成するtoken数」の上限である。
`max_length` は入力promptと生成tokenを足した全体長を指すが、`max_new_tokens` を指定した場合はそちらが優先される。

このrunbookでは、次の形で扱う。

```text
prompt_tokens + effective_max_new_tokens <= model.config.max_position_embeddings
```

`Qwen/Qwen3-0.6B` では、2026-09-04確認時点の `config.json` に `max_position_embeddings: 40960` がある。
したがって、理論上は `40960 - prompt_tokens` まで新規生成tokenを増やせる。

ただし、これは「モデル設定上の上限」であり、Colab無料CPUで快適に動く上限ではない。
実運用では、時間、RAM、runtime切断、出力品質を見て小さく決める。

このrunbookの推奨値:

| 用途 | `max_new_tokens` |
|---|---:|
| 最短疎通 | 160 |
| 短い計画や要約 | 320 |
| 少し長い日本語回答 | 600 |
| 落語学習のような構造化初稿 | 900から1200 |
| 長文限界確認 | 2000以上。ただしColab CPUでは時間がかかるため後回し |

実行コードの仕様:

| field | 意味 |
|---|---|
| `requested_max_new_tokens` | caseで指定した希望上限 |
| `effective_max_new_tokens` | model contextを超えないように丸めた実際の上限 |
| `context_available_new_tokens` | 現在のpromptで理論上残っている生成token枠 |

時間目安:

```text
estimated_generation_seconds = effective_max_new_tokens / tokens_per_second
```

2026-09-04のColab CPU実測では、おおむね `3.6` から `4.4 tokens/sec`。
したがって、`max_new_tokens=1200` は生成だけで約4.5分から5.6分、`6400` は約24分から30分弱かかる可能性がある。

Transformersには `max_time` もあるが、このrunbookでは初期値として使わない。
理由は、時間で止めると出力途中終了とモデル品質を分けにくくなるため。
まずは `max_new_tokens` をcaseごとに決め、`generation_seconds` と `tokens_per_second` を測る。

`max_new_tokens` を大きくしすぎるデメリット:

| デメリット | 内容 |
|---|---|
| 時間が伸びる | tokenを1つずつ生成するため、上限を増やすほど遅くなる |
| RAM使用量が増える | 生成中のattention cacheが長くなり、memoryを使う |
| runtime切断リスクが上がる | Colab無料CPUでは長時間cellが安定しない可能性がある |
| 蛇足が増える | modelがEOSで止まらない場合、上限まで説明を続けることがある |
| 比較しにくくなる | modelごとに長さが大きく違うと、品質差と長さ差を分けにくい |

`max_new_tokens=40960` は推奨しない。
理由は、`prompt_tokens + max_new_tokens` が `max_position_embeddings` を超えやすく、仮に入ってもColab CPUでは時間とmemoryの負担が大きい。
今回の実測速度 `3.6` から `4.5 tokens/sec` で40960 tokenを生成すると、単純計算で約2.5時間から3.2時間かかる。

文字数制約の扱い:

- `max_new_tokens` は安全装置であり、文章のちょうどよい長さを作る指示ではない。
- 実用出力では、promptにも `800字以内`、`各見出し3行以内`、`練習タスクは5個だけ` のような長さ制約を入れる。
- ただし、長さ制約を強くしすぎると、構成や発想が制約に引っ張られ、内容の厚みや多様性が落ちることがある。
- 初回評価では `max_new_tokens` は少し余裕を持たせ、prompt側で `必要項目` と `長すぎる説明は禁止` を指定する。

case別 `max_new_tokens` の考え方:

- `max_new_tokens` は出力tokenの上限であり、増やすことはできる。
- ただし、増やすほど `generation_seconds` は伸びる。
- 入力token数と出力token数の合計がmodelのcontext上限を超えると失敗する。
- Colab CPUでは、長く出すほど待ち時間、RAM使用量、runtime切断リスクが上がる。
- まず `160`、短い実用確認で `300` から `400`、長めの構造化出力で `900` から `1200`、それ以上は必要な時だけ試す。

context上限を確認するセル:

```python
print({
    "model": getattr(model.config, "model_type", None),
    "max_position_embeddings": getattr(model.config, "max_position_embeddings", None),
    "max_window_layers": getattr(model.config, "max_window_layers", None),
    "sliding_window": getattr(model.config, "sliding_window", None),
})
```

無料Colab CPUでのコストの見方:

| 種類 | 見るfield |
|---|---|
| 金銭コスト | 無料枠なら原則0円。ただし保証なし |
| 時間コスト | `cell_total_seconds`、`case_total_seconds`、`generation_seconds` |
| 推論効率 | `tokens_per_second` |
| memoryコスト | `ram_used_gb` |
| 打ち切りリスク | `hit_max_new_tokens`、`finished_reason_hint` |

生成preset:

| field | 値 | 理由 |
|---|---:|---|
| `do_sample` | true | Qwen公式model cardのnon-thinking mode推奨に合わせる |
| `temperature` | 0.7 | Qwen公式model cardのnon-thinking mode推奨値 |
| `top_p` | 0.8 | Qwen公式model cardのnon-thinking mode推奨値 |
| `top_k` | 20 | Qwen公式model cardのnon-thinking mode推奨値 |
| `min_p` | 0 | Qwen公式model cardのnon-thinking mode推奨値。Transformers側で未対応ならfallbackで外す |

過去の `do_sample=False` は再現性を見る目的では使えるが、Qwen公式の推奨設定ではない。
Qwen公式model cardは、greedy decodingが性能劣化や反復につながる可能性に触れている。
したがって、`Language mismatch` や反復が出た旧結果は、model能力だけでなく、prompt不足と生成preset不一致を含む実験結果として扱う。

期待する出力例:

```text
===
METRICS
{
  "case_id": "reasoning.short.001",
  "started_at_utc": "2026-09-04T00:00:00.000000+00:00",
  "requested_max_new_tokens": 320,
  "effective_max_new_tokens": 320,
  "model_context_limit": 40960,
  "context_available_new_tokens": 40912,
  "prepare_seconds": 0.02,
  "generation_seconds": 12.34,
  "case_total_seconds": 12.36,
  "prompt_tokens": 48,
  "new_tokens": 80,
  "remaining_new_token_budget": 240,
  "tokens_per_second": 6.48,
  "ram_used_gb": 3.21,
  "thinking_control": "disabled_by_chat_template",
  "generation_preset": {"do_sample": true, "temperature": 0.7, "top_p": 0.8, "top_k": 20, "min_p": 0},
  "hit_max_new_tokens": false,
  "finished_reason_hint": "stopped_before_limit"
}
MODEL OUTPUT
1. ...
2. ...
3. ...
===
ALL RESULTS JSON
{
  "cell_started_at_utc": "2026-09-04T00:00:00.000000+00:00",
  "cell_total_seconds": 25.01,
  "default_max_new_tokens": 320,
  "results": [...]
}
```

この時点の判定:

| case_id | OK | NG |
|---|---|---|
| `reasoning.short.001` | 3ステップで、予算0円、30分以内、記録が入っている | 4ステップ以上、抽象論だけ、条件無視 |
| `json.contract.001` | JSON風ではなくJSONとしてparseできる | Markdown、説明文、余計なfieldが混ざる |

### 5.1 疎通用の最小推論結果

実行日: 2026-09-04

ユーザーがColab無料CPUで旧版の `疎通用の最小推論セル` を実行した結果:

| case_id | generation_seconds | new_tokens | tokens_per_second | ram_used_gb | 判定 |
|---|---:|---:|---:|---:|---|
| `reasoning.short.001` | 57.83 | 160 | 2.77 | 3.12 | 生成は成功。回答は `<think>` 途中で打ち切り。3ステップ回答未到達 |
| `json.contract.001` | 35.42 | 160 | 4.52 | 3.12 | 生成は成功。回答は `<think>` 途中で打ち切り。JSON未到達 |

計測上の判断:

- 旧版セルの計測値は `model.generate(...)` の所要時間であり、セル全体の所要時間ではない。
- 2件の `generation_seconds` 合計は93.25秒。したがって、このセルだけでも少なくとも約93秒かかっている。
- 前段のmodel load 29.27秒を足すと、loadから最小推論2件までの計測済み時間は少なくとも122.52秒。
- `new_tokens` が2件とも160なので、`max_new_tokens=160` に到達して打ち切られた可能性が高い。
- 2件とも `<think>` の途中で終わっているため、この結果は「modelがCPUで生成できた」証跡としてはOK。ただし「指示どおり回答できた」「JSON契約を守れた」証跡としてはNG。
- 次は、上の新版セルで `enable_thinking=False` を試し、`thinking_control` と `hit_max_new_tokens` を見て再測定する。

### 5.2 疎通用の最小推論結果 再測定

実行日: 2026-09-04

ユーザーがColab無料CPUで修正版の `疎通用の最小推論セル` を実行した結果。

1回目:

| case_id | generation_seconds | case_total_seconds | prompt_tokens | new_tokens | tokens_per_second | ram_used_gb | thinking_mode(旧field) | hit_max_new_tokens | 判定 |
|---|---:|---:|---:|---:|---:|---:|---|---|---|
| `reasoning.short.001` | 43.46 | 43.47 | 53 | 160 | 3.68 | 3.08 | `disabled_by_chat_template` | true | 生成は成功。3ステップ構造は出始めたが、160 tokenで途中終了 |
| `json.contract.001` | 16.53 | 16.54 | 35 | 71 | 4.29 | 3.09 | `disabled_by_chat_template` | false | JSON形式では停止。ただし内容は入力と関係が薄い |

1回目セル全体:

```text
cell_total_seconds: 60.01
max_new_tokens: 160
```

2回目:

| case_id | generation_seconds | case_total_seconds | prompt_tokens | new_tokens | tokens_per_second | ram_used_gb | thinking_mode(旧field) | hit_max_new_tokens | 判定 |
|---|---:|---:|---:|---:|---:|---:|---|---|---|
| `reasoning.short.001` | 44.01 | 44.02 | 53 | 160 | 3.64 | 3.11 | `disabled_by_chat_template` | true | 1回目と同様。160 tokenで途中終了 |
| `json.contract.001` | 16.07 | 16.07 | 35 | 71 | 4.42 | 3.11 | `disabled_by_chat_template` | false | 1回目と同じ英語JSON。形式は守るが内容は弱い |

2回目セル全体:

```text
cell_total_seconds: 60.09
max_new_tokens: 160
```

判断:

- 時間計測はできている。セル全体は1回目60.01秒、2回目60.09秒でほぼ同じ。
- 2件の `generation_seconds` 合計は、1回目59.99秒、2回目60.08秒で、`cell_total_seconds` とほぼ一致している。
- `prepare_seconds` は0.0秒なので、この範囲ではほぼ生成処理に時間がかかっている。
- `reasoning.short.001` は `hit_max_new_tokens=true` のため、出力上限で打ち切られている。新版セルの `max_new_tokens=320` 以上で再試行する価値がある。
- `json.contract.001` はJSONとしては返っているが、内容が「言語設定ミスマッチ」の話になっており、入力に対する応答としては弱い。
- thinking抑制は効いているため、前回の `<think>` 途中終了よりは改善している。
- `do_sample=False` のため、同じ入力では結果がかなり再現される。今回の2回は速度も出力傾向も安定している。

公式推奨との差分:

- この時点のセルは `do_sample=False` のgreedy decodingで実行していた。
- Qwen公式model cardでは、non-thinking modeは `Temperature=0.7`、`TopP=0.8`、`TopK=20`、`MinP=0` が推奨されている。
- そのため、`json.contract.001` の `Language mismatch` は、モデルが本当に日本語非対応という証跡ではない。
- 同時に、こちらの生成presetが公式推奨からズレていたため、出力品質の評価としては弱い。
- prompt側も、JSONの形だけを指定し、要約対象の本文を渡していないため不十分。

日本語対応の見方:

- この結果だけで `Qwen/Qwen3-0.6B` が日本語非対応とは判定しない。
- ただし、`json.contract.001` は日本語の指示に対して英語で返しているため、日本語指示追従は弱い可能性がある。
- prompt側にも弱さがある。JSONの形だけを指定し、何を要約するかを渡していないため、modelが勝手に内容を作っている。
- 次に見るなら、`日本語で返してください`、`英語は禁止`、`topic`、`入力本文` を明示したJSON caseに変える。

日本語JSONの再試行prompt:

```text
次のJSONだけを日本語で返してください。Markdown、英語、説明文は禁止です。

入力:
Colab無料CPUでQwen3 0.6Bを読み込み、短い推論を実行した。生成はできたが、一部の回答は途中で切れた。

schema:
{
  "summary": "string",
  "risks": ["string"],
  "next_action": "string"
}
```

### 5.3 短文計画 max_new_tokens 320 再試行

実行日: 2026-09-04

ユーザーが `reasoning.short.001` を `max_new_tokens=320` で再実行した結果。

| case_id | generation_seconds | case_total_seconds | prompt_tokens | new_tokens | remaining_new_token_budget | tokens_per_second | ram_used_gb | hit_max_new_tokens | 判定 |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| `reasoning.short.001` | 84.76 | 84.77 | 53 | 320 | 0 | 3.78 | 3.08 | true | 3ステップまでは出たが、内容が重複し、上限で終了 |
| `json.contract.001` | 15.82 | 15.83 | 35 | 71 | 89 | 4.49 | 3.09 | false | JSON形式は守るが、内容が入力と関係薄い英語 |

セル全体:

```text
cell_total_seconds: 100.6
default_max_new_tokens: 320
```

判断:

- `reasoning.short.001` は `160` より改善し、3ステップ目まで到達した。
- ただし `new_tokens=320`、`remaining_new_token_budget=0`、`hit_max_new_tokens=true` なので、まだ上限に当たっている。
- 出力内容は「緊急時の対応」「結果を記録」が各ステップで繰り返されており、token上限だけでなく、promptの完了条件と重複禁止も必要。
- `json.contract.001` は前回と同じ英語JSONに寄っている。日本語JSON評価には、入力本文と日本語指定を明示した別caseが必要。
- 次は短文計画なら `max_new_tokens=480` から `600`、落語学習なら `1200` を試す。ただし、promptに `重複禁止`、`各ステップ2行以内`、`全体800字以内` のような長さと情報構成の制約を入れる。

### 5.4 短文計画 max_new_tokens 860 再試行

実行日: 2026-09-04

ユーザーが `reasoning.short.001` と `json.contract.001` を `max_new_tokens=860` で再実行した結果。

| case_id | generation_seconds | case_total_seconds | prompt_tokens | new_tokens | remaining_new_token_budget | tokens_per_second | ram_used_gb | hit_max_new_tokens | 判定 |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| `reasoning.short.001` | 122.97 | 122.97 | 53 | 351 | 509 | 2.85 | 3.08 | false | 3ステップと締め文まで出た。内容重複あり |
| `json.contract.001` | 22.92 | 22.92 | 35 | 71 | 789 | 3.10 | 3.09 | false | JSON形式では停止。ただし内容は入力と関係が薄い英語 |

セル全体:

```text
cell_total_seconds: 145.9
default_max_new_tokens: 320
case max_new_tokens: 860
```

時間換算:

- `cell_total_seconds=145.9` 秒は、約2分25.9秒。
- `reasoning.short.001` の `generation_seconds=122.97` 秒は、約2分2.97秒。
- `json.contract.001` の `generation_seconds=22.92` 秒は、約22.92秒。

判断:

- `max_new_tokens=860` を指定しても、実際の生成は `reasoning.short.001` が351 token、`json.contract.001` が71 tokenで止まった。
- 2件とも `hit_max_new_tokens=false` なので、今回はtoken上限で打ち切られていない。
- `stopped_before_limit` は上限前に止まったという意味だけで、内容品質を保証しない。
- `reasoning.short.001` は完結したが、各stepの中身がかなり重複している。
- `json.contract.001` は `Language mismatch` を返しているが、promptに入力本文がなく、旧実行は `do_sample=False` だったため、この結果だけで言語能力を判定しない。

### 6. Colab結果の記録

Notebook末尾に次を貼り、値を埋める。

```markdown
## Colab CPU result

date: 2026-09-04
runtime: Google Colab free / CPU
model: Qwen/Qwen3-0.6B
ram_gb:
load_seconds:

| case_id | elapsed_seconds | new_tokens | tokens_per_second | contract_ok | memo |
|---|---:|---:|---:|---|---|
| reasoning.short.001 |  |  |  |  |  |
| json.contract.001 |  |  |  |  |  |

failures:
-

next:
-
```

### 7. Colab環境確認結果

実行日: 2026-09-04

ユーザーがColab無料枠で `環境確認セル` を実行した結果:

```text
python: 3.13.15 (main, Aug  6 2026, 11:06:23) [GCC 11.4.0]
platform: Linux-6.6.122+-x86_64-with-glibc2.35
cpu_count: 2
ram_gb: 12.67
```

判断:

- CPUは2 core。
- RAMは12.67GB。
- まず `Qwen/Qwen3-0.6B` だけで進める。
- `Qwen/Qwen3-1.7B` 以上は、0.6Bのloadと短文推論が通ってから試す。
- `gpt-oss:20b`、`qwen3-coder:30b` は、このCPU/RAM条件で最初に試す対象ではない。

次に実行するセル:

```python
!pip -q install -U "transformers>=4.55.0" accelerate psutil
```

### 8. 超軽量な実運用タスク

現状の `比較prompt` は、指示追従やJSON出力を見るための最小テストである。

実際にどのくらい使える文章が出るかを見るには、短いJSONやログ分類では弱い。

次は、少し長めの日本語アウトプットを要求し、構造、具体性、話の流れ、練習タスク、評価指標まで出せるかを見る。

| case_id | 依頼の種類 | 見ること | 合格条件 |
|---|---|---|---|
| `rakugo.learning.plan.001` | 学習設計 | 指定要素を落とさず、日本語で段階的に整理できるか | 6つの要求を全部含み、練習タスク5個と評価指標が具体的 |
| `rakugo.learning.plan.scored.001` | 学習設計 + 5段階評価 | 出力本文と採点基準を同時に出せるか | 学習計画、練習タスク、5段階評価基準、自己チェックが揃う |

ここで見るのは、厳密な正解ではなく、実際に人が読んで使える初稿が出るかである。

#### Prompt Versions

| version | case_id | 状態 | 目的 | 結果 |
|---|---|---|---|---|
| v1 | `rakugo.learning.plan.001` | 実測済み | 落語学習の長めの構造化出力を見る | 6見出しは出たが、反復が多く、練習タスクの目的/手順/完了条件が弱い |
| v2 | `rakugo.learning.plan.scored.001` | 実測済み | 5段階評価、自己チェック、反復抑制まで1回で出せるか見る | 1600 token上限に到達し、評価基準途中で切れた。評価軸混同も出た |
| v3 | `rakugo.learning.plan.scored.001` | 実測済み | v2に評価軸分離、中学生向け説明、NG/OK例を足した修正版 | 1600 token上限に到達し、評価基準途中で切れた。反復と評価軸混同は残った |
| v4 | `rakugo.learning.case.practice.001` | 未実測 | 言い回し、ケース練習、会話の流れ、挟む内容、なぜ良いかを出す専用prompt | 次フェーズで実行 |

v1からv3の実測結果は下の `実行結果` に残す。
v4は、v3で不足した「言い回し、ケース練習、会話の流れ、根拠」を見るための次フェーズ用promptとして別に置く。

#### 実行セル 5段階評価付き

`モデル読み込みセル` の後に実行する。

```python
import json
import time
from datetime import datetime, timezone
import psutil

GENERATION_PRESET = {
    "do_sample": True,
    "temperature": 0.7,
    "top_p": 0.8,
    "top_k": 20,
    "min_p": 0,
}

PRACTICAL_TASKS = [
    {
        "case_id": "rakugo.learning.plan.scored.001",
        "max_new_tokens": 1600,
        "prompt": """あなたは落語の学習計画を作る先生です。
内部思考や推論過程は出さず、日本語で最終回答だけを書いてください。

目的:
落語を初期フェーズから学び、現実世界の会話にも自然に取り入れられるようにする。

評価したい観点:
- 反応の良さ
- 話の強弱
- 起承転結
- 盛り上がりの作り方
- 現実世界の会話への転用しやすさ
- 1人練習の具体性

評価軸の分離:
- 各評価軸のscore条件は、その軸だけで判定する。
- 上位scoreの条件に、別の評価軸を混ぜない。
- 例: 「話の強弱」のscore 5に「起承転結がある」「盛り上がりがある」を入れない。
- 例: 「起承転結」のscore 5に「盛り上がりがある」を入れない。
- 評価軸同士の関係は、点数基準ではなく `## 評価軸間の関係` に分けて書く。
- 起承転結は、話の順序、展開、転換、落ちの構造を見る。
- 盛り上がりは、聞き手の期待、ズレ、緊張と緩和、笑いの山を見る。
- 両者は関係するが、同じ現象として扱わない。

中学生にもわかる説明:
- 起承転結は、話をどの順番で並べるかを見るもの。
- 盛り上がりは、聞いている人の気持ちがどこで上がるかを見るもの。
- 例: 同じ4コマ漫画でも、コマの順番が起承転結、読んで笑う場所が盛り上がり。
- だから、順番が正しいことと、面白く盛り上がることは別々に採点する。

評価基準のNG/OK例:
- NG: 話の強弱 score 5 = 起承転結があり、盛り上がりがある。
- OK: 話の強弱 score 5 = 声の大きさ、速さ、間、語尾を意図して変え、録音を聞いて変えた場所を3つ説明できる。
- NG: 起承転結 score 5 = 盛り上がりがある。
- OK: 起承転結 score 5 = 起で状況、承で追加情報、転で予想外のズレ、結で短い落ちがあり、4つの役割が混ざっていない。
- NG: 盛り上がり score 5 = 起承転結ができている。
- OK: 盛り上がり score 5 = 聞き手の予想を作り、転で少し裏切り、結の直前に間を置いて反応が出る。

回答の作り方:
- まず各見出しの役割を分けてから書く。
- 同じ意味の文を別見出しへ言い換えて置かない。
- 「自然にできる」「質が向上する」「理解する」だけで終わる文は禁止。
- 抽象語を使ったら、次の文で必ず具体行動、観察ポイント、記録する値のどれかに置き換える。
- 落語の話法を、日常会話の場面に移す例を最低3つ入れる。
- 各練習タスクは、5分から15分で1人実行できる粒度にする。
- 最後に、重複している文がないか自己チェックし、重複があれば削った前提で最終回答を書く。

具体化ルール:
- NG: 会話の質が向上する。
- OK: 相手の発言を1語拾い、「つまり〇〇ってことですね」と返す練習を10回録音する。
- NG: 起承転結を意識する。
- OK: 30秒の話を「状況説明、少し困ること、予想外のズレ、短い落ち」の4文に分けて書く。
- NG: 盛り上がりを作る。
- OK: 先に普通の答えを言い、次に少しだけ角度をずらした例えを入れ、最後を短く切る。

重複回避ルール:
- 同じ動詞で終わる箇条書きを3つ以上続けない。
- 各見出しで扱う主語を変える。例: 反応の良さは「聞く」、強弱は「声と間」、起承転結は「構成」、盛り上がりは「ズレと落ち」。
- 前の見出しと同じ結論になる場合は、違いを1文で書く。

必ず入れる内容:
1. 初期フェーズからの全体ステップ
2. 反応の良さを身につける方法
3. 話の強弱を作る方法
4. 起承転結を作る方法
5. 盛り上がりのための話し方、要素、入れるコツ
6. 落語から現実世界での会話へスムーズに取り入れるために、1人で練習できる詳細タスクを5個
7. 評価指標と、どう考えて何を見るか
8. 5段階評価基準
9. 評価軸間の関係

出力形式:
## 全体ステップ
各ステップについて、目的、やること、見るポイントを1つずつ書く。

## 反応の良さ
練習方法、会話で見るポイント、失敗例を分けて書く。

## 話の強弱
声の大きさ、速度、間、語尾、表情を分けて、それぞれ練習方法を書く。

## 起承転結
起、承、転、結を分けて、それぞれの役割、作り方、失敗例を書く。

## 盛り上がりの作り方
使う要素、入れるタイミング、やりすぎの注意を分けて書く。

## 1人で練習できる詳細タスク5個
5個だけ出す。各タスクは、目的、手順、完了条件を書く。

## 評価指標
評価軸、何を見るか、記録する値を表で書く。

## 5段階評価基準
次の評価軸ごとに、score 1, 2, 3, 4, 5 の基準を書く。
各scoreには「満たしている条件」をチェックリスト形式で書く。
表形式で書く。
各scoreの条件には、その評価軸以外の条件を混ぜない。

評価軸:
- 反応の良さ
- 話の強弱
- 起承転結
- 盛り上がり
- 会話への転用
- 練習タスクの具体性

## この回答の自己チェック
上の6つの評価軸について、scoreを1から5で付ける。
各scoreについて、根拠、足りない点、次に直すことを書く。
表形式で書く。

## 評価軸間の関係
起承転結と盛り上がりについて、同じ点、違う点、混ぜると評価が壊れる点を3行で書く。

条件:
- 抽象論だけで終えない
- 各ステップに、やることと見るポイントを書く
- 練習タスク5個は、1つずつ目的、手順、完了条件を書く
- 現実世界の会話へ取り入れる時の注意点も入れる
- 同じ内容を別見出しで繰り返さない
- 「自然にできる」「質が向上する」だけで終えない
- 評価基準は、読んだ人が1から5を選べる粒度にする
- 自己チェックのscoreは甘くしない。根拠が弱い場合は3以下にする
- score基準は累積条件にしない。例: score 5はscore 4に別軸を足す形にしない
""",
    },
]

RESULTS = []
cell_started_at = datetime.now(timezone.utc).isoformat()
cell_started = time.perf_counter()
model_context_limit = getattr(model.config, "max_position_embeddings", None)

def resolve_effective_max_new_tokens(requested_max_new_tokens, prompt_tokens):
    if model_context_limit is None:
        return requested_max_new_tokens, None
    context_available_new_tokens = max(int(model_context_limit) - int(prompt_tokens), 0)
    return min(requested_max_new_tokens, context_available_new_tokens), context_available_new_tokens

for case in PRACTICAL_TASKS:
    case_started_at = datetime.now(timezone.utc).isoformat()
    case_started = time.perf_counter()
    messages = [{"role": "user", "content": case["prompt"]}]
    requested_max_new_tokens = int(case.get("max_new_tokens", 1600))

    prepare_started = time.perf_counter()
    try:
        inputs = tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
            enable_thinking=False,
        )
        thinking_control = "disabled_by_chat_template"
    except TypeError:
        inputs = tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        )
        thinking_control = "chat_template_option_unavailable"
    prepare_elapsed = time.perf_counter() - prepare_started
    prompt_tokens = int(inputs["input_ids"].shape[-1])
    effective_max_new_tokens, context_available_new_tokens = resolve_effective_max_new_tokens(
        requested_max_new_tokens,
        prompt_tokens,
    )

    if effective_max_new_tokens <= 0:
        raise ValueError({
            "case_id": case["case_id"],
            "prompt_tokens": prompt_tokens,
            "model_context_limit": model_context_limit,
            "message": "promptだけでmodel context上限に達しているため生成できない",
        })

    generation_started = time.perf_counter()
    with torch.no_grad():
        try:
            outputs = model.generate(
                **inputs,
                max_new_tokens=effective_max_new_tokens,
                **GENERATION_PRESET,
            )
            generation_preset = GENERATION_PRESET
        except ValueError as error:
            fallback_preset = {
                "do_sample": True,
                "temperature": 0.7,
                "top_p": 0.8,
                "top_k": 20,
            }
            outputs = model.generate(
                **inputs,
                max_new_tokens=effective_max_new_tokens,
                **fallback_preset,
            )
            generation_preset = {
                **fallback_preset,
                "fallback_reason": str(error),
            }
    generation_elapsed = time.perf_counter() - generation_started
    case_total_elapsed = time.perf_counter() - case_started

    new_tokens = outputs.shape[-1] - inputs["input_ids"].shape[-1]
    text = tokenizer.decode(outputs[0][inputs["input_ids"].shape[-1]:], skip_special_tokens=True)
    hit_max_new_tokens = int(new_tokens) >= effective_max_new_tokens

    result = {
        "case_id": case["case_id"],
        "started_at_utc": case_started_at,
        "requested_max_new_tokens": requested_max_new_tokens,
        "effective_max_new_tokens": effective_max_new_tokens,
        "model_context_limit": model_context_limit,
        "context_available_new_tokens": context_available_new_tokens,
        "prepare_seconds": round(prepare_elapsed, 2),
        "generation_seconds": round(generation_elapsed, 2),
        "case_total_seconds": round(case_total_elapsed, 2),
        "prompt_tokens": prompt_tokens,
        "new_tokens": int(new_tokens),
        "remaining_new_token_budget": max(effective_max_new_tokens - int(new_tokens), 0),
        "tokens_per_second": round(new_tokens / generation_elapsed, 2) if generation_elapsed > 0 else None,
        "ram_used_gb": round(psutil.Process().memory_info().rss / 1024**3, 2),
        "thinking_control": thinking_control,
        "generation_preset": generation_preset,
        "hit_max_new_tokens": hit_max_new_tokens,
        "finished_reason_hint": "hit_max_new_tokens_possible_truncation" if hit_max_new_tokens else "stopped_before_limit",
        "output": text,
    }
    RESULTS.append(result)

    print("===")
    print("METRICS")
    print(json.dumps({k: v for k, v in result.items() if k != "output"}, ensure_ascii=False, indent=2))
    print("MODEL OUTPUT")
    print(text)

print("===")
print("ALL RESULTS JSON")
print(json.dumps({
    "cell_started_at_utc": cell_started_at,
    "cell_total_seconds": round(time.perf_counter() - cell_started, 2),
    "default_max_new_tokens": 1600,
    "model_context_limit": model_context_limit,
    "results": RESULTS,
}, ensure_ascii=False, indent=2))
```

#### 実行セル ケース練習・言い回し・根拠

v3では、評価軸分離と具体例を足しても、出力が途中で切れ、具体的な言い回しやケース練習までは十分に出なかった。

次は「落語学習計画全体」ではなく、「現実会話へ移す練習の中身」だけを見る。
5ケース分のセリフと根拠を出すため、初期値は `max_new_tokens=2000` にする。重い場合は `1600` に下げてよい。

```python
import json
import time
from datetime import datetime, timezone
import psutil

GENERATION_PRESET = {
    "do_sample": True,
    "temperature": 0.7,
    "top_p": 0.8,
    "top_k": 20,
    "min_p": 0,
}

PRACTICAL_TASKS = [
    {
        "case_id": "rakugo.learning.case.practice.001",
        "max_new_tokens": 2000,
        "prompt": """あなたは落語の学びを、日常会話の練習に変換する先生です。
内部思考や推論過程は出さず、日本語で最終回答だけを書いてください。

目的:
落語の話し方を、1人練習で日常会話に取り入れられる形へ変換する。

今回出してほしいもの:
- チェックシート
- 具体的な言い回し
- ケース練習
- ケースごとの会話の流れ
- どこに何を挟むか
- なぜそれが良いか、なぜ面白くなるかの根拠

前提:
- 初心者向け。
- 1人で練習する。
- 1ケースは5分から15分で終わる。
- 抽象論だけで終えない。
- 「自然にできる」「質が向上する」「理解する」だけで終わる文は禁止。

中学生にもわかる説明:
- 起承転結は、話を並べる順番。
- 盛り上がりは、聞いている人の気持ちが上がる場所。
- 言い回しは、実際に口に出すセリフ。
- ケース練習は、場面を決めて同じ型を何度も試す練習。

必ず入れる日常会話ケース:
1. 相手が仕事や作業で困っている話をした時
2. 雑談で相手の話を広げたい時
3. 自分の失敗談を軽く話したい時
4. 相手を責めずに違和感を伝えたい時
5. 話が平坦になった時に少しだけ面白くしたい時

出力形式:

## 使う型
落語から日常会話へ移す型を5個出す。
各型は、名前、使う場面、短い説明、使いすぎの注意を書く。

## チェックシート
次の列を持つ表で書く。
評価項目 / 見ること / OKの例 / NGの例 / 記録する値

## ケース練習5個
5ケースだけ出す。
各ケースは次の形で書く。

### ケースN: <場面名>
- 場面:
- 目的:
- 会話の流れ:
  1. 起: <最初に言うこと>
  2. 承: <相手の話を受ける言い方>
  3. 転: <少し角度を変える言い方>
  4. 結: <短く締める言い方>
- 実際の言い回し:
  - 通常版:
  - 少し面白くする版:
  - やりすぎ版:
- 挟む内容:
  - どこに挟むか:
  - 何を挟むか:
  - なぜそこが良いか:
- 面白くなる根拠:
- 1人練習:
  - 手順:
  - 録音で見る点:
  - 完了条件:

## 評価方法
5段階で評価する。
評価軸は、反応の良さ、話の流れ、言い回しの使いやすさ、盛り上がり、やりすぎていないか、の5つ。
各評価軸について、score 1から5の基準を表で書く。

条件:
- ケースごとに、実際に口に出せるセリフを必ず入れる
- なぜ良いかを、聞き手の気持ち、話の流れ、ズレ、間のどれかで説明する
- 同じ言い回しを3回以上使い回さない
- 起承転結と盛り上がりを同じ意味として扱わない
""",
    },
]

RESULTS = []
cell_started_at = datetime.now(timezone.utc).isoformat()
cell_started = time.perf_counter()
model_context_limit = getattr(model.config, "max_position_embeddings", None)

def resolve_effective_max_new_tokens(requested_max_new_tokens, prompt_tokens):
    if model_context_limit is None:
        return requested_max_new_tokens, None
    context_available_new_tokens = max(int(model_context_limit) - int(prompt_tokens), 0)
    return min(requested_max_new_tokens, context_available_new_tokens), context_available_new_tokens

for case in PRACTICAL_TASKS:
    case_started_at = datetime.now(timezone.utc).isoformat()
    case_started = time.perf_counter()
    messages = [{"role": "user", "content": case["prompt"]}]
    requested_max_new_tokens = int(case.get("max_new_tokens", 1600))

    prepare_started = time.perf_counter()
    try:
        inputs = tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
            enable_thinking=False,
        )
        thinking_control = "disabled_by_chat_template"
    except TypeError:
        inputs = tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        )
        thinking_control = "chat_template_option_unavailable"
    prepare_elapsed = time.perf_counter() - prepare_started
    prompt_tokens = int(inputs["input_ids"].shape[-1])
    effective_max_new_tokens, context_available_new_tokens = resolve_effective_max_new_tokens(
        requested_max_new_tokens,
        prompt_tokens,
    )

    if effective_max_new_tokens <= 0:
        raise ValueError({
            "case_id": case["case_id"],
            "prompt_tokens": prompt_tokens,
            "model_context_limit": model_context_limit,
            "message": "promptだけでmodel context上限に達しているため生成できない",
        })

    generation_started = time.perf_counter()
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=effective_max_new_tokens,
            **GENERATION_PRESET,
        )
    generation_elapsed = time.perf_counter() - generation_started
    case_total_elapsed = time.perf_counter() - case_started

    new_tokens = outputs.shape[-1] - inputs["input_ids"].shape[-1]
    text = tokenizer.decode(outputs[0][inputs["input_ids"].shape[-1]:], skip_special_tokens=True)
    hit_max_new_tokens = int(new_tokens) >= effective_max_new_tokens

    result = {
        "case_id": case["case_id"],
        "started_at_utc": case_started_at,
        "requested_max_new_tokens": requested_max_new_tokens,
        "effective_max_new_tokens": effective_max_new_tokens,
        "model_context_limit": model_context_limit,
        "context_available_new_tokens": context_available_new_tokens,
        "prepare_seconds": round(prepare_elapsed, 2),
        "generation_seconds": round(generation_elapsed, 2),
        "case_total_seconds": round(case_total_elapsed, 2),
        "prompt_tokens": prompt_tokens,
        "new_tokens": int(new_tokens),
        "remaining_new_token_budget": max(effective_max_new_tokens - int(new_tokens), 0),
        "tokens_per_second": round(new_tokens / generation_elapsed, 2) if generation_elapsed > 0 else None,
        "ram_used_gb": round(psutil.Process().memory_info().rss / 1024**3, 2),
        "thinking_control": thinking_control,
        "generation_preset": GENERATION_PRESET,
        "hit_max_new_tokens": hit_max_new_tokens,
        "finished_reason_hint": "hit_max_new_tokens_possible_truncation" if hit_max_new_tokens else "stopped_before_limit",
        "output": text,
    }
    RESULTS.append(result)

    print("===")
    print("METRICS")
    print(json.dumps({k: v for k, v in result.items() if k != "output"}, ensure_ascii=False, indent=2))
    print("MODEL OUTPUT")
    print(text)

print("===")
print("ALL RESULTS JSON")
print(json.dumps({
    "cell_started_at_utc": cell_started_at,
    "cell_total_seconds": round(time.perf_counter() - cell_started, 2),
    "default_max_new_tokens": 2000,
    "model_context_limit": model_context_limit,
    "results": RESULTS,
}, ensure_ascii=False, indent=2))
```

#### 実行結果 max_new_tokens 1200

実行日: 2026-09-04

ユーザーが `rakugo.learning.plan.001` を `max_new_tokens=1200` で実行した結果。

| case_id | generation_seconds | case_total_seconds | prompt_tokens | new_tokens | remaining_new_token_budget | tokens_per_second | ram_used_gb | hit_max_new_tokens |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `rakugo.learning.plan.001` | 171.52 | 171.53 | 330 | 636 | 564 | 3.71 | 3.12 | false |

セル全体:

```text
cell_total_seconds: 171.53
default_max_new_tokens: 1200
model_context_limit: 40960
```

時間換算:

- `cell_total_seconds=171.53` 秒は、約2分51.53秒。
- `generation_seconds=171.52` 秒なので、ほぼ生成時間がそのままセル全体時間になっている。

出力の観察:

- 6見出しは揃った。
- `new_tokens=636`、`remaining_new_token_budget=564`、`hit_max_new_tokens=false` なので、1200 token上限では打ち切られていない。
- 内容は「自然にできる」「質が向上する」の反復が多く、練習タスクの `目的 / 手順 / 完了条件` は分かれていない。
- 5段階評価基準は出ていない。次の実行セルでは `max_new_tokens=1600` にし、出力形式に `5段階評価基準` と `この回答の自己チェック` を追加する。

#### 実行結果 max_new_tokens 1600

実行日: 2026-09-04

ユーザーが `rakugo.learning.plan.scored.001` を `max_new_tokens=1600` で実行した結果。

| case_id | generation_seconds | case_total_seconds | prompt_tokens | new_tokens | remaining_new_token_budget | tokens_per_second | ram_used_gb | hit_max_new_tokens |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `rakugo.learning.plan.scored.001` | 672.79 | 672.82 | 1214 | 1600 | 0 | 2.38 | 3.13 | true |

生成preset:

```json
{
  "do_sample": true,
  "temperature": 0.7,
  "top_p": 0.8,
  "top_k": 20,
  "min_p": 0
}
```

セル全体:

```text
cell_total_seconds: 672.83
default_max_new_tokens: 1600
model_context_limit: 40960
```

時間換算:

- `cell_total_seconds=672.83` 秒は、約11分12.83秒。
- `generation_seconds=672.79` 秒なので、ほぼ生成時間がそのままセル全体時間になっている。
- `tokens_per_second=2.38` で、前回の `3.71 tokens/sec` より遅い。

出力の観察:

- `prompt_tokens=1214` まで増えた。前回の `330` より約3.68倍。
- `new_tokens=1600`、`remaining_new_token_budget=0`、`hit_max_new_tokens=true` なので、出力は途中で切れている。
- `5段階評価基準` の出力途中で止まり、`この回答の自己チェック` には到達していない。
- 反復抑制promptを入れても、「会話の質が向上」「生じている」などの反復が残っている。
- タスクの `目的 / 手順 / 完了条件` は分かれたが、手順が似通っており、現実の練習としては弱い。
- `話の強弱`、`起承転結`、`盛り上がり` のscore条件が混ざっている。例: `話の強弱` の高score条件に `起承転結` と `盛り上がり` が入っている。
- `起承転結` と `盛り上がり` は関係するが、評価軸としては別に扱う必要がある。起承転結は構造、盛り上がりは聞き手側の期待、ズレ、緊張と緩和を見る。

AI目線の仮評価:

| field | score | 理由 |
|---|---:|---|
| `structure_score` | 2 | 見出しは出たが、5段階評価基準の途中で切れ、自己チェックが欠けた |
| `detail_score` | 2 | 具体例は一部あるが、抽象語と反復が多い |
| `practical_score` | 2 | 5タスクは出たが、手順が似すぎていて使い分けにくい |
| `transfer_score` | 2 | 日常会話への転用は触れているが、場面別の具体例が少ない |
| `speed_score` | 1 | 11分超で、Colab CPU上の反復実験には重い |

評価設計の修正:

- `話の強弱`、`起承転結`、`盛り上がり` を別軸に分ける。
- 各score条件には、その評価軸以外の条件を混ぜない。
- 評価軸同士の関係は `評価軸間の関係` に分けて書かせる。
- 次のpromptでは `score基準は累積条件にしない` を明示する。

中学生にもわかる具体例:

| 評価軸 | 何を見るか | 混ぜると壊れる例 | 分けた後の例 |
|---|---|---|---|
| `話の強弱` | 声の大きさ、速さ、間、語尾 | score 5に `起承転結がある` を入れる | `録音を聞いて、声を強くした場所と間を置いた場所を3つ説明できる` |
| `起承転結` | 話の順番と役割 | score 5に `盛り上がりがある` を入れる | `起=状況、承=追加、転=ズレ、結=短い落ちが分かれている` |
| `盛り上がり` | 聞き手の期待、ズレ、反応の山 | score 5に `起承転結がある` を入れる | `相手が予想した答えから少しずらし、落ちの前に間を置ける` |

修正後promptの狙い:

- 評価軸ごとのscore条件を別々に作らせる。
- 似た言葉を並べるだけの採点を避ける。
- `評価軸間の関係` は別セクションに逃がし、点数基準へ混ぜない。

#### 実行結果 max_new_tokens 1600 v3

実行日: 2026-09-04

ユーザーが、評価軸分離、中学生向け説明、NG/OK例を追加した `rakugo.learning.plan.scored.001` v3を `max_new_tokens=1600` で実行した結果。

| case_id | generation_seconds | case_total_seconds | prompt_tokens | new_tokens | remaining_new_token_budget | tokens_per_second | ram_used_gb | hit_max_new_tokens |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `rakugo.learning.plan.scored.001` | 827.81 | 827.88 | 1906 | 1600 | 0 | 1.93 | 3.13 | true |

生成preset:

```json
{
  "do_sample": true,
  "temperature": 0.7,
  "top_p": 0.8,
  "top_k": 20,
  "min_p": 0
}
```

セル全体:

```text
cell_total_seconds: 827.9
default_max_new_tokens: 1600
model_context_limit: 40960
```

時間換算:

- `cell_total_seconds=827.9` 秒は、約13分47.9秒。
- `generation_seconds=827.81` 秒なので、ほぼ生成時間がそのままセル全体時間になっている。
- `tokens_per_second=1.93` で、v2の `2.38 tokens/sec` よりさらに遅い。

出力の観察:

- `prompt_tokens=1906` まで増えた。v2の `1214` より約1.57倍。
- `new_tokens=1600`、`remaining_new_token_budget=0`、`hit_max_new_tokens=true` のため、出力は途中で切れている。
- `5段階評価基準` の `score 4` 途中で止まり、`この回答の自己チェック` と `評価軸間の関係` には到達していない。
- `評価軸分離` を明示しても、`反応の良さ` に `起承転結` と `盛り上がり` が入り、評価軸混同が残った。
- `1人で練習できる詳細タスク5個` は、同じ手順と完了条件の反復が多い。
- `聽いている人` のような不自然な表記が混ざった。

不足していた指示:

- チェックシートとして、どの言い回しを見ればよいか。
- ケースごとに、実際に口に出すセリフ。
- ケースごとに、起、承、転、結のどこへ何を挟むか。
- なぜその言い回しが良いか、なぜ面白くなるかの根拠。
- 1人練習で録音を聞いた時に、何をOK/NGにするか。

AI目線の仮評価:

| field | score | 理由 |
|---|---:|---|
| `structure_score` | 2 | 見出しは出たが、評価基準途中で切れ、自己チェックと評価軸間の関係が欠けた |
| `detail_score` | 2 | 具体例は増えたが、ケース別の言い回し、挟む内容、根拠が足りない |
| `practical_score` | 2 | 5タスクは出たが、同じ手順が反復され、練習として使い分けにくい |
| `transfer_score` | 2 | 日常会話への転用は書かれたが、場面別の会話例が薄い |
| `speed_score` | 1 | 約13分48秒で、Colab CPUの反復実験には重い |

この結果からの判断:

- Colab無料CPUで `Qwen/Qwen3-0.6B` を動かす基礎検証は完了扱いでよい。
- ただし、このモデルとCPU条件で、長い日本語構造化promptを一発で完成品質にするのは弱い。
- 次フェーズでは、総合計画promptではなく、`ケース練習・言い回し・根拠` を出す専用promptに分ける。

性能としての見立て:

- Colab無料CPUで `Qwen/Qwen3-0.6B` を動かす基礎検証としては使える。
- 日本語の長めの構造化初稿をそのまま任せる用途では、現時点の出力品質は弱い。
- 生成が遅くなった主因は、長いprompt、1600 token上限、上限到達、CPU推論、sampling設定の組み合わせ。
- 次は1回のpromptに全部詰めず、`本文生成`、`評価基準生成`、`自己チェック` を分けて測る。

#### 手動判定表 5段階

実行結果を見て埋める。scoreはAI目線の仮評価であり、ユーザー調整前提の材料として扱う。

| case_id | structure_score | detail_score | practical_score | transfer_score | speed_score | memo |
|---|---:|---:|---:|---:|---:|---|
| `rakugo.learning.plan.scored.001` v2 | 2 | 2 | 2 | 2 | 1 | 11分超。評価基準途中で切れ、自己チェック未到達 |
| `rakugo.learning.plan.scored.001` v3 | 2 | 2 | 2 | 2 | 1 | 約13分48秒。具体例追加後も途中切れ、反復、評価軸混同が残った |

判定:

| score | 基準 |
|---:|---|
| 1 | 指定見出しや必須項目が大きく欠ける。実行手順として使えない |
| 2 | 見出しは一部あるが、抽象論が多く、タスクや評価基準がそのまま使えない |
| 3 | 必須項目はおおむね揃うが、具体性、重複の少なさ、評価基準の明確さに不足がある |
| 4 | そのまま初稿として使える。目的、手順、完了条件、評価基準がほぼ揃う |
| 5 | 人間が少し整えるだけで使える。具体例、失敗例、評価基準、次の改善まで揃う |

評価軸:

| field | 見ること |
|---|---|
| `structure_score` | 指定見出しと必須項目が揃っているか |
| `detail_score` | 各項目に具体的なやること、見るポイント、注意点があるか |
| `practical_score` | 1人練習タスク5個が、目的、手順、完了条件まで使える形か |
| `transfer_score` | 落語から現実会話へ移す方法が分かるか |
| `speed_score` | Colab CPUで反復実験できる時間か |

追加で見るfield:

| field | 見ること |
|---|---|
| `cell_total_seconds` | 体感に近いセル全体時間 |
| `generation_seconds` | 純粋な生成時間 |
| `tokens_per_second` | CPU推論速度 |
| `thinking_control` | thinking抑制指定が使えたかを記録する独自メタ情報 |
| `generation_preset` | 生成時に使った `do_sample`、`temperature`、`top_p`、`top_k`、`min_p` |
| `hit_max_new_tokens` | 途中で打ち切られた可能性があるか |

#### この段階の進行判断

| 結果 | 次 |
|---|---|
| 構造、具体性、速度が許容範囲 | `Qwen/Qwen3-1.7B` またはローカルOllamaへ進む |
| `<think>` だけで終わる | `enable_thinking=False` が効いているか確認し、promptを短くする |
| `hit_max_new_tokens=true` | case側の `max_new_tokens` を増やすか、要求項目を減らして再試行 |
| 速度が遅すぎる | Colab CPUは疎通確認だけで終了 |
| OOM | runtime restart後、0.6Bより小さい候補へ下げる |

#### 残っている検証ステップ

このフェーズで完了したこと:

| step | 目的 | 完了条件 |
|---|---|---|
| v3再実行 | 評価軸分離と具体例追加で、反復と評価軸混同が減るか見る | `rakugo.learning.plan.scored.001` の新結果を保存し、v2と比較できる |

次フェーズでやる:

| step | 目的 | 完了条件 |
|---|---|---|
| ケース練習・言い回し・根拠prompt | v3で不足した具体的なセリフ、会話の流れ、挟む内容、なぜ良いかを出す | `rakugo.learning.case.practice.001` の出力に、5ケース、実際の言い回し、根拠、チェックシートが揃う |
| 本文生成/評価基準/自己チェックの分割 | 1回のpromptに詰め込みすぎた影響を分ける | 3 caseに分け、各caseが途中で切れない |
| JSON case再試行 | `Language mismatch` がprompt不足か見る | 日本語指定、英語禁止、入力本文ありで再実行し、JSON parse可否を記録する |
| 速度比較 | CPU性能差を切り分ける | Colab GPU、ローカルOllama、llama.cpp量子化のどれか1つと比較する |
| 評価表の機械チェック | 見出し不足、score重複、途中切れを人手だけにしない | 出力textを簡易scriptで検査し、missing/duplicate/truncatedを出す |

## ローカルOllamaで動かす

### 1. Ollamaを入れる

公式サイトから入れる。

```text
https://ollama.com/download
```

インストール後、terminalで確認する。

```bash
ollama --version
```

### 2. 小型モデルをpullする

```bash
ollama pull qwen3:0.6b
```

少し余裕があれば次も試す。

```bash
ollama pull qwen3:1.7b
ollama pull qwen3:4b
```

重いので後回し:

```bash
ollama pull qwen3:8b
ollama pull gpt-oss:20b
ollama pull qwen3-coder:30b
```

### 3. CLIで疎通確認

```bash
ollama run qwen3:0.6b
```

入力:

```text
次の条件を満たす最小の作業計画を3ステップで出してください。条件: 予算0円、30分以内、記録を残す。
```

終了:

```text
/bye
```

### 4. APIで速度を測る

Ollamaは通常 `http://localhost:11434` でlocal APIを立てる。

```bash
curl http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3:0.6b",
    "prompt": "次の条件を満たす最小の作業計画を3ステップで出してください。条件: 予算0円、30分以内、記録を残す。",
    "stream": false,
    "options": {
      "temperature": 0,
      "num_predict": 160
    }
  }'
```

返ってきたJSONで見るfield:

| field | 意味 |
|---|---|
| `response` | モデル出力 |
| `total_duration` | 全体時間。nanoseconds |
| `load_duration` | モデルload時間。nanoseconds |
| `prompt_eval_count` | prompt token数 |
| `eval_count` | output token数 |
| `eval_duration` | output生成時間。nanoseconds |

tokens/secの計算:

```text
eval_count / (eval_duration / 1_000_000_000)
```

### 5. OpenAI-compatible APIで投げる

```bash
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ollama" \
  -d '{
    "model": "qwen3:0.6b",
    "messages": [
      {
        "role": "user",
        "content": "次の形式だけで返してください。{\"summary\": string, \"risks\": string[], \"next_action\": string}"
      }
    ],
    "temperature": 0,
    "max_tokens": 160
  }'
```

これが通れば、ハーネス側はOpenAI SDK互換の向き先だけ変えればよい。

接続設定例:

```bash
export OPENAI_BASE_URL="http://localhost:11434/v1"
export OPENAI_API_KEY="ollama"
export OPENAI_MODEL="qwen3:0.6b"
```

## ローカルllama.cppで動かす

Ollamaで足りない時だけ試す。最初は必須ではない。

### 1. install

```bash
brew install llama.cpp
```

### 2. Hugging Face上のGGUFを直接serveする

```bash
llama serve -hf ggml-org/Qwen3.5-0.8B-GGUF
```

期待:

- `http://127.0.0.1:8080` にserverが立つ。
- browserで簡易UIを開ける。
- APIで投げられる。

### 3. API確認

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "JSONだけで返してください。{\"ok\": true, \"memo\": string}"
      }
    ],
    "temperature": 0,
    "max_tokens": 120
  }'
```

## gpt-oss:20bを試す条件

`gpt-oss:20b` は最初の疎通用ではなく、次の条件を満たしてから試す。

- ローカルに16GB以上のVRAMまたはunified memoryがある。
- `qwen3:0.6b` と `qwen3:1.7b` の疎通が完了している。
- download容量と実行時間を許容できる。
- CPU offloadは遅い前提で見る。

Ollama:

```bash
ollama pull gpt-oss:20b
ollama run gpt-oss:20b
```

OpenAI-compatible API:

```bash
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ollama" \
  -d '{
    "model": "gpt-oss:20b",
    "messages": [
      {
        "role": "user",
        "content": "次の作業を、前提・手順・失敗条件・次actionに分けてください: ローカルOSSモデルをハーネスに接続する"
      }
    ],
    "temperature": 0,
    "max_tokens": 300
  }'
```

## 比較prompt

全モデルに同じ入力を使う。

### Case 1: 指示追従

```text
次の条件を満たす最小の作業計画を3ステップで出してください。
条件:
- 予算0円
- 30分以内
- 記録を残す
禁止:
- 4ステップ以上にしない
- 抽象論だけで終えない
```

合格:

- 3ステップだけ。
- 予算0円、30分以内、記録が反映されている。
- 実行可能な内容になっている。

### Case 2: JSON contract

```text
次のJSONだけで返してください。
schema:
{
  "summary": "string",
  "risks": ["string"],
  "next_action": "string"
}
topic: ローカルOSSモデルを試す
```

合格:

- JSONとしてparseできる。
- 指定fieldだけ。
- Markdown説明を混ぜない。

### Case 3: harness接続

```text
あなたはlocal model runnerです。
次の入力を `check_result` として判定してください。

input:
- command: "npm test"
- exit_code: 1
- stderr: "Cannot find module './config'"

返答形式:
{
  "status": "pass|fail|unknown",
  "reason": "string",
  "next_action": "string"
}
```

合格:

- `status` は `fail`。
- `reason` にmodule不足が入る。
- `next_action` が具体的。

## 記録テンプレート

実験ごとにこの形で残す。

```json
{
  "schemaVersion": "oss-llm-local-run.v1",
  "runId": "2026-09-04.local.ollama.qwen3-0-6b.case1.r1",
  "date": "2026-09-04",
  "runner": "ollama",
  "environment": {
    "place": "local",
    "os": "",
    "arch": "",
    "cpu": "",
    "ramGb": null,
    "gpu": "",
    "vramGb": null
  },
  "model": {
    "id": "qwen3:0.6b",
    "source": "ollama",
    "quantization": "unknown"
  },
  "caseId": "reasoning.short.001",
  "settings": {
    "temperature": 0,
    "maxTokens": 160
  },
  "metrics": {
    "loadSeconds": null,
    "totalSeconds": null,
    "outputTokens": null,
    "tokensPerSecond": null
  },
  "result": {
    "contractOk": null,
    "instructionFollowOk": null,
    "memo": ""
  },
  "failure": null
}
```

## 判定

| 判定 | 条件 |
|---|---|
| 継続 | 小型モデルで疎通し、1 case以上が合格 |
| ローカル候補 | OpenAI-compatible APIが通り、JSON contract caseが合格 |
| 重いモデルへ進む | `qwen3:1.7b` 以上でtokens/secが許容範囲 |
| 保留 | download、memory、速度のどれかで実験が止まる |
| 不採用 | JSON contractが3回連続で破綻し、prompt修正でも改善しない |

初期の速度目安:

| 用途 | 最低目安 |
|---|---:|
| 疎通確認 | 0.5 tokens/sec以上 |
| 短い分類/判定 | 2 tokens/sec以上 |
| 日常的な補助 | 5 tokens/sec以上 |
| agent loop | 10 tokens/sec以上 |

## よくある失敗

| 失敗 | 原因候補 | 対応 |
|---|---|---|
| Colabでruntimeが切れる | 無料枠の制限、idle、重い処理 | 小型モデル、短時間、Notebook内実行にする |
| Colab CPUが遅すぎる | CPU推論の限界 | 疎通だけに使い、速度評価はローカル/GPUへ |
| gpt-oss:20bが動かない | memory不足 | 先に小型モデルでハーネス接続だけ確認 |
| JSONが壊れる | モデル能力、prompt不足 | `temperature: 0`、短いschema、再試行3回 |
| OpenAI SDKで失敗 | endpoint差、Responses API非対応 | Chat Completions互換から試す |

## 次に作るもの

1. `oss-llm-local-run.v1` のJSON schema。
2. `runs/` 配下の実測ログ。
3. local provider adapter。
4. 同一caseをClaude/Codex/API/OSSで比較するgrader。

## 参照元

確認日: 2026-09-04

| source | URL | このrunbookで使った事実 |
|---|---|---|
| Hugging Face Transformers Generation docs | https://huggingface.co/docs/transformers/v5.15.1/en/main_classes/text_generation | `max_new_tokens` は入力promptを除いた新規生成token数の上限。`max_length` より `max_new_tokens` の利用が推奨される。`max_time` も指定可能 |
| Qwen/Qwen3-0.6B config.json | https://huggingface.co/Qwen/Qwen3-0.6B/blob/main/config.json | `max_position_embeddings` は40960。`Qwen3ForCausalLM`、`model_type: qwen3`、`torch_dtype: bfloat16` |
| QwenLM Qwen3 Transformers docs | https://github.com/QwenLM/Qwen3/blob/main/docs/source/inference/transformers.md | Qwen3のthinking / non-thinking mode、`/no_think`、`enable_thinking=False` 相当の扱い、長文contextとYaRNの注意 |
| Google Colab FAQ | https://research.google.com/colaboratory/faq.html | 無料枠のリソースは保証されず、GPU種別や使用上限は変動する |
| Google Colab FAQ UK | https://research.google.com/colaboratory/intl/en-GB/faq.html | 無料管理runtimeでSSH、remote desktop、Web UI中心利用、distributed worker等が制限対象 |
| OpenAI Cookbook gpt-oss + Ollama | https://github.com/openai/openai-cookbook/blob/main/articles/gpt-oss/run-locally-ollama.md | `gpt-oss:20b` は16GB VRAM/unified memory目安、OllamaはChat Completions互換APIを提供 |
| OpenAI Cookbook gpt-oss + Transformers | https://github.com/openai/openai-cookbook/blob/main/articles/gpt-oss/run-transformers.md | `gpt-oss-20b` はMXFP4時に約16GB VRAM目安、bf16では約48GBになる |
| OpenAI gpt-oss announcement | https://openai.com/index/introducing-gpt-oss/ | `gpt-oss-20b` / `120b` はopen-weight reasoning modelで、20bは16GB memory目安 |
| Ollama qwen3 | https://ollama.com/library/qwen3 | `qwen3` の0.6b、1.7b、4b、8bなどのモデルサイズとcontext |
| Ollama qwen3-coder | https://ollama.com/library/qwen3-coder | `qwen3-coder:30b` のサイズとcoding / agent用途 |
| llama.cpp | https://github.com/ggml-org/llama.cpp | local/cloudで軽量推論でき、OpenAI-compatible API serverを起動できる |
| llama.cpp serve docs | https://llama.app/docs/serve | `llama serve` がOpenAI-compatible APIとWeb UIを提供する |
