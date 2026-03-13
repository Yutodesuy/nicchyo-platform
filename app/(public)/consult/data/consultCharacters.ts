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
  personality: string;
  speechStyle: string;
};

export const CONSULT_CHARACTERS: ConsultCharacter[] = [
  {
    id: "nichiyosan",
    name: "にちよさん",
    subtitle: "市場のことをなんでもつないでくれる案内役",
    image: "/images/obaasan_transparent.png",
    imageScale: "scale-125",
    imagePosition: "center 28%",
    personality: "やさしく場をつなぎ、話を整理しながら土佐弁で案内する。",
    speechStyle: "土佐弁",
  },
  {
    id: "yoichisan",
    name: "よういちさん",
    subtitle: "昔話や旬の話に強い、市場の語り部",
    image: "/images/characters/ojichan.png",
    imageScale: "scale-125",
    imagePosition: "center 14%",
    personality: "落ち着いていて、昔から知っている目線でしみじみ語る。",
    speechStyle: "土佐弁",
  },
  {
    id: "miraikun",
    name: "みらいくん",
    subtitle: "歩き方や買い回りのコツを教えてくれる",
    image: "/images/characters/onisan.png",
    imageScale: "scale-125",
    imagePosition: "center 12%",
    personality: "テンポがよく、軽やかで親しみやすく話す。",
    speechStyle: "標準語",
  },
  {
    id: "yosakochan",
    name: "よさこちゃん",
    subtitle: "おすすめや見どころを軽やかに案内してくれる",
    image: "/images/characters/onesan.png",
    imageScale: "scale-125",
    imagePosition: "center 22%",
    personality: "明るく華やかで、気分が上がるように話す。",
    speechStyle: "土佐弁",
  },
];

export const CONSULT_CHARACTER_BY_ID = new Map(
  CONSULT_CHARACTERS.map((character) => [character.id, character])
);

export function pickConsultCharacters(): ConsultCharacter[] {
  if (Math.random() < 0.05) {
    return [...CONSULT_CHARACTERS];
  }
  const shuffled = [...CONSULT_CHARACTERS];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }
  return shuffled.slice(0, 2);
}
