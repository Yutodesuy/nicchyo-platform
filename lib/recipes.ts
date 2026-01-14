export type Ingredient = {
  id: string;
  name: string;
  aliases?: string[];
  seasonal?: boolean;
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  heroImage?: string;
  author?: string;
  ingredientIds: string[];
  ingredients: Ingredient[];
  cookTime: string;
  difficulty: "easy" | "normal" | "hard";
  steps: string[];
};

export const ingredientCatalog: Ingredient[] = [
  { id: "carrot", name: "にんじん", aliases: ["人参"] },
  { id: "eggplant", name: "なす", aliases: ["ナス", "茄子"], seasonal: true },
  { id: "ginger", name: "しょうが", aliases: ["生姜", "ショウガ"], seasonal: true },
  { id: "katsuo", name: "かつお", aliases: ["カツオ", "鰹"], seasonal: true },
  { id: "lettuce", name: "レタス" },
  { id: "tomato", name: "トマト" },
  { id: "mikan", name: "みかん" },
  { id: "apple", name: "りんご" },
  { id: "banana", name: "バナナ" },
  { id: "grape", name: "ぶどう" },
  { id: "pear", name: "梨" },
  { id: "cucumber", name: "きゅうり" },
  { id: "potato", name: "じゃがいも" },
  { id: "onion", name: "玉ねぎ" },
  { id: "soy-sauce", name: "しょうゆ", aliases: ["醤油"] },
  { id: "miso", name: "味噌" },
  { id: "vinegar", name: "酢" },
  { id: "oil", name: "油" },
  { id: "dashi", name: "だし" },
  { id: "shiso", name: "大葉", aliases: ["しそ", "シソ"] },
  { id: "yuzu", name: "ゆず", aliases: ["柚子"], seasonal: true },
  { id: "rice", name: "ごはん", aliases: ["米"] },
  { id: "salt", name: "塩" },
  { id: "buntan", name: "ぶんたん", aliases: ["文旦"], seasonal: true },
];

export const ingredientIcons: Record<string, string> = {
  carrot: "🥕",
  eggplant: "🍆",
  ginger: "🫚",
  katsuo: "🐟",
  lettuce: "🥬",
  tomato: "🍅",
  mikan: "🍊",
  apple: "🍎",
  banana: "🍌",
  grape: "🍇",
  pear: "🍐",
  cucumber: "🥒",
  potato: "🥔",
  onion: "🧅",
  "soy-sauce": "🧂",
  miso: "🥣",
  vinegar: "🧪",
  oil: "🫒",
  dashi: "🍵",
  shiso: "🌿",
  yuzu: "🍋",
  rice: "🍚",
  salt: "🧂",
  buntan: "🍊",
};

export const recipes: Recipe[] = [
  {
    id: "eggplant-ginger",
    title: "焼きなすの生姜ぽん酢",
    description: "焼いて和えるだけのスピード副菜。薬味たっぷりで市場の新鮮さを味わう。",
    heroImage: "/images/recipes/eggplant-ginger.jpg",
    author: "市場の台所 さゆりさん",
    ingredientIds: ["eggplant", "ginger", "salt"],
    ingredients: [
      { id: "eggplant", name: "なす", seasonal: true },
      { id: "ginger", name: "しょうが", seasonal: true },
      { id: "salt", name: "塩" },
    ],
    cookTime: "15分",
    difficulty: "easy",
    steps: ["なすを焼いて皮をむく", "ざっくり裂いて生姜と和える", "ぽん酢でさっと味付け"],
  },
  {
    id: "katsuo-don",
    title: "かつおのタタキ丼",
    description: "炙りかつおを刻んで薬味たっぷり。仕上げにゆずをしぼる高知の定番。",
    heroImage: "/images/recipes/katsuo-don.jpg",
    author: "かつお屋さん",
    ingredientIds: ["katsuo", "ginger", "shiso", "yuzu", "rice"],
    ingredients: [
      { id: "katsuo", name: "かつお", seasonal: true },
      { id: "ginger", name: "しょうが" },
      { id: "shiso", name: "大葉" },
      { id: "yuzu", name: "ゆず", seasonal: true },
      { id: "rice", name: "ごはん" },
    ],
    cookTime: "20分",
    difficulty: "normal",
    steps: ["かつおを炙って刻む", "薬味と和える", "丼に盛りゆずをしぼる"],
  },
  {
    id: "buntan-salad",
    title: "ぶんたんと大葉のサラダ",
    description: "柑橘とハーブの爽やかサラダ。ぶんたんの季節はぜひ。",
    heroImage: "/images/recipes/buntan-salad.jpg",
    author: "市場の台所 さゆりさん",
    ingredientIds: ["buntan", "shiso", "salt"],
    ingredients: [
      { id: "buntan", name: "ぶんたん", seasonal: true },
      { id: "shiso", name: "大葉" },
      { id: "salt", name: "塩" },
    ],
    cookTime: "10分",
    difficulty: "easy",
    steps: ["ぶんたんを房から出す", "大葉を刻む", "塩とオイルで和える"],
  },
  {
    id: "tosa-tataki",
    title: "土佐のかつおたたき",
    description: "土佐の定番。炙ったかつおに香味野菜を合わせる一皿。",
    author: "かつお屋さん",
    ingredientIds: ["katsuo", "ginger", "shiso", "yuzu", "salt"],
    ingredients: [
      { id: "katsuo", name: "かつお", seasonal: true },
      { id: "ginger", name: "しょうが" },
      { id: "shiso", name: "大葉" },
      { id: "yuzu", name: "ゆず", seasonal: true },
      { id: "salt", name: "塩" },
    ],
    cookTime: "15分",
    difficulty: "normal",
    steps: ["かつおをさっと炙る", "薬味を刻む", "塩とゆずでさっぱり仕上げる"],
  },
  {
    id: "ina-kazushi",
    title: "土佐の田舎寿司風",
    description: "酢を利かせたごはんに野菜を添える、土佐らしい寿司風。",
    author: "市場の台所 さゆりさん",
    ingredientIds: ["rice", "vinegar", "cucumber", "ginger", "salt"],
    ingredients: [
      { id: "rice", name: "ごはん" },
      { id: "vinegar", name: "酢" },
      { id: "cucumber", name: "きゅうり" },
      { id: "ginger", name: "しょうが" },
      { id: "salt", name: "塩" },
    ],
    cookTime: "25分",
    difficulty: "normal",
    steps: ["酢飯を作る", "きゅうりとしょうがを下ごしらえする", "酢飯にのせて整える"],
  },
  {
    id: "yuzu-miso",
    title: "ゆず味噌和え",
    description: "ゆずの香りと味噌でまとめる土佐の家庭の味。",
    author: "市場の台所 さゆりさん",
    ingredientIds: ["yuzu", "miso", "salt"],
    ingredients: [
      { id: "yuzu", name: "ゆず", seasonal: true },
      { id: "miso", name: "味噌" },
      { id: "salt", name: "塩" },
    ],
    cookTime: "10分",
    difficulty: "easy",
    steps: ["ゆずの皮と果汁を用意する", "味噌と合わせる", "塩で味を整える"],
  },
  {
    id: "nasu-tataki",
    title: "なすのたたき",
    description: "焼いたなすにしょうゆと薬味を合わせる、土佐の定番副菜。",
    author: "市場の台所 さゆりさん",
    ingredientIds: ["eggplant", "soy-sauce", "ginger", "shiso", "salt"],
    ingredients: [
      { id: "eggplant", name: "なす", seasonal: true },
      { id: "soy-sauce", name: "しょうゆ" },
      { id: "ginger", name: "しょうが" },
      { id: "shiso", name: "大葉" },
      { id: "salt", name: "塩" },
    ],
    cookTime: "15分",
    difficulty: "easy",
    steps: ["なすを焼いて冷ます", "薬味を刻む", "しょうゆで和える"],
  },
  {
    id: "mikan-shiso",
    title: "みかんと大葉のさっぱり和え",
    description: "みかんの甘酸っぱさと大葉の香りを活かした小鉢。",
    author: "市場の台所 さゆりさん",
    ingredientIds: ["mikan", "shiso", "salt"],
    ingredients: [
      { id: "mikan", name: "みかん" },
      { id: "shiso", name: "大葉" },
      { id: "salt", name: "塩" },
    ],
    cookTime: "5分",
    difficulty: "easy",
    steps: ["みかんを房に分ける", "大葉を刻む", "塩でさっと和える"],
  },
];

export const seasonalCollections = [
  {
    id: "spring",
    title: "春の新ものレシピ",
    description: "春野菜をさっと仕上げる小鉢を中心に。",
    recipeIds: [
      "eggplant-ginger",
      "buntan-salad",
      "nasu-tataki",
      "katsuo-don",
      "tosa-tataki",
      "ina-kazushi",
      "yuzu-miso",
      "mikan-shiso",
    ],
  },
  {
    id: "summer",
    title: "夏のひんやり土佐ごはん",
    description: "暑い日でも食べやすいさっぱり一品。",
    recipeIds: [
      "buntan-salad",
      "katsuo-don",
      "tosa-tataki",
      "eggplant-ginger",
      "nasu-tataki",
      "ina-kazushi",
      "yuzu-miso",
      "mikan-shiso",
    ],
  },
  {
    id: "autumn",
    title: "秋の香ばしレシピ",
    description: "香り高い食材で食欲をそそるラインナップ。",
    recipeIds: [
      "eggplant-ginger",
      "katsuo-don",
      "ina-kazushi",
      "buntan-salad",
      "tosa-tataki",
      "yuzu-miso",
      "nasu-tataki",
      "mikan-shiso",
    ],
  },
  {
    id: "winter",
    title: "冬のあったか土佐ごはん",
    description: "体が温まる鍋と汁物を中心に。",
    recipeIds: [
      "katsuo-don",
      "yuzu-miso",
      "eggplant-ginger",
      "buntan-salad",
      "tosa-tataki",
      "ina-kazushi",
      "nasu-tataki",
      "mikan-shiso",
    ],
  },
];

export function getSeasonalRecipeIds(date = new Date()): string[] {
  const m = date.getMonth() + 1;
  const season =
    m >= 3 && m <= 5
      ? "spring"
      : m >= 6 && m <= 8
        ? "summer"
        : m >= 9 && m <= 11
          ? "autumn"
          : "winter";
  const pick = seasonalCollections.find((c) => c.id === season);
  return pick ? pick.recipeIds : seasonalCollections[0].recipeIds;
}

export function pickDailyRecipe(seedDate = new Date()): Recipe {
  const ids = getSeasonalRecipeIds(seedDate);
  const pool = recipes.filter((r) => ids.includes(r.id));
  if (pool.length === 0) return recipes[0];
  // deterministic-ish pick per day
  const daySeed = Number(`${seedDate.getFullYear()}${seedDate.getMonth() + 1}${seedDate.getDate()}`);
  const idx = daySeed % pool.length;
  return pool[idx];
}
