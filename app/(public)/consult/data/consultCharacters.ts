export type ConsultCharacterId =
  | "nichiyosan"
  | "yoichisan"
  | "miraikun"
  | "yosakochan";

export type ConsultCharacter = {
  id: ConsultCharacterId;
  name: string;
  subtitle: string;
  image: string;
  imageScale: string;
  imagePosition: string;
  styleNote: string;
  strengths: string[];
  keywords: string[];
};

export const CONSULT_CHARACTERS: ConsultCharacter[] = [
  {
    id: "nichiyosan",
    name: "にちよさん",
    subtitle: "市場のことをなんでもつないでくれる案内役",
    image: "/images/obaasan_transparent.png",
    imageScale: "scale-125",
    imagePosition: "center 28%",
    styleNote: "やさしく場をつなぎ、話を整理しながら土佐弁で案内する。",
    strengths: ["全体案内", "初回の説明", "話の整理", "まとめ"],
    keywords: ["はじめて", "どこ", "回り方", "おすすめ", "全体", "案内"],
  },
  {
    id: "yoichisan",
    name: "よういちさん",
    subtitle: "昔話や旬の話に強い、市場の語り部",
    image: "/images/characters/ojichan.png",
    imageScale: "scale-125",
    imagePosition: "center 14%",
    styleNote: "昔から知っている目線で、旬や土地の話を少し混ぜて語る。",
    strengths: ["旬の食材", "歴史", "昔話", "地元の空気感"],
    keywords: ["旬", "昔", "歴史", "地元", "野菜", "果物", "季節"],
  },
  {
    id: "miraikun",
    name: "みらいくん",
    subtitle: "歩き方や買い回りのコツを教えてくれる",
    image: "/images/characters/onisan.png",
    imageScale: "scale-125",
    imagePosition: "center 12%",
    styleNote: "テンポよく、動線や効率、いまっぽい楽しみ方を軽やかに話す。",
    strengths: ["回遊", "混雑回避", "効率", "食べ歩き", "若い視点"],
    keywords: ["回り方", "効率", "混雑", "近く", "順番", "食べ歩き"],
  },
  {
    id: "yosakochan",
    name: "よさこちゃん",
    subtitle: "おすすめや見どころを軽やかに案内してくれる",
    image: "/images/characters/onesan.png",
    imageScale: "scale-125",
    imagePosition: "center 22%",
    styleNote: "明るく軽やかで、見た目の楽しさや体験の魅力を添えて話す。",
    strengths: ["見どころ", "写真映え", "おみやげ", "やわらかいおすすめ"],
    keywords: ["写真", "映え", "おみやげ", "かわいい", "楽しい", "見どころ"],
  },
];

export const CONSULT_CHARACTER_BY_ID = new Map(
  CONSULT_CHARACTERS.map((character) => [character.id, character])
);

export function pickConsultCharacters(question: string): ConsultCharacter[] {
  const normalized = question.replace(/\s+/g, "");
  const weighted = CONSULT_CHARACTERS.map((character) => {
    const keywordScore = character.keywords.reduce((score, keyword) => {
      return normalized.includes(keyword) ? score + 1.2 : score;
    }, 0);
    return {
      character,
      score: 1 + keywordScore + Math.random() * 0.35,
    };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((entry) => entry.character);

  if (weighted.length === 2) {
    return weighted;
  }
  return CONSULT_CHARACTERS.slice(0, 2);
}

