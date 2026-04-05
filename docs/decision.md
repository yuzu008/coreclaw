## 2026-04-05: 領域プリセットを実験作成APIで提供

### 何の判断か
- 社会学/経営学/宗教学/哲学の4領域を、CoreClawで再現性高く素早く立ち上げる方法を決める判断。

### どう判断したか
- 新しいAPIを乱立せず、既存 `POST /api/experiments` に `preset_id` を追加して拡張する。
- 領域定義は `src/domain-presets.ts` の型付き定数で管理する。
- 初期文脈は `system` メッセージとして注入し、会話冒頭の品質を安定化する。

### 影響
- 新API: `GET /api/domain-presets`
- 既存API拡張: `POST /api/experiments` (`preset_id` 任意)
- 新規テスト: `src/domain-presets.test.ts`
