// Japanese (ja) product-name tokens for names built from a brand + descriptive words + model code
// ("Aries Corner Black NS" -> "Aries コーナー ブラック NS", "Heater Guard – Tower Wall" ->
// "ヒーターガード – Tower ウォール"). Brand / line names map to themselves; only a small, reliable
// set of descriptive words is composed here — anything with a longer free-form description
// ("… with Vertical Wooden Handle Arc") is hand-mapped in the phrase files, because Japanese word
// order differs too much for token-by-token composition. Model codes (NB, NS, Ni2, W9, V2, 2.0 ...)
// are kept automatically by the engine. See PRODUCT-TRANSLATION-CONVENTIONS.md ("Naming conventions").
export default {
  nameTokens: {
    // brands / lines / model designations — stay English
    Aries: "Aries",
    Cubos: "Cubos",
    Phoenix: "Phoenix",
    SAWO30: "SAWO30",
    Nordex: "Nordex",
    Tower: "Tower",
    Helius: "Helius",
    Mini: "Mini",
    Savonia: "Savonia",
    Krios: "Krios",
    Cumulus: "Cumulus",
    Scandia: "Scandia",
    Combi: "Combi",
    Scandifire: "Scandifire",
    Fiberjungle: "Fiberjungle",
    Minidragon: "Minidragon",
    Heaterking: "Heaterking",
    Taurus: "Taurus",
    Nimbus: "Nimbus",
    Pro: "Pro",
    PLUS: "PLUS",
    Innova: "Innova",
    Saunova: "Saunova",
    Classic: "Classic",
    "Steam 2.0": "Steam 2.0",
    "Infrared 2.0": "Infrared 2.0",
    SAWO: "SAWO",
    // descriptive words
    Corner: "コーナー",
    Round: "ラウンド",
    Wall: "ウォール",
    Floor: "フロア",
    Middle: "センター",
    Black: "ブラック",
    Red: "レッド",
    Fibercoated: "ファイバーコート",
    "Fiber Coated": "ファイバーコート",
    "Heater Guard": "ヒーターガード",
    "Integration Collar": "カラー",
    "Heater Hood": "ヒーターフード",
    "(Stainless)": "(ステンレス)",
    "(Wooden)": "(木製)",
    "Contactor Unit": "コンタクターユニット",
    "Power Controller": "パワーコントローラー",
    "Built-In": "ビルトイン",
    "User Interface": "ユーザーインターフェース",
    "Stainless Steel Touch": "ステンレスタッチ",
  },
};
