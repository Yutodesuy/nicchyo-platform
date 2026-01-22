import { AboutIconName } from "./AboutIcon";

export type AboutSlide = {
  id: string;
  title: string;
  description: string;
  iconName?: AboutIconName;
  action?: {
    label: string;
    href: string;
    primary?: boolean;
  };
};

export const aboutSlides: AboutSlide[] = [
  {
    id: "intro",
    title: "nicchyo",
    description: "日曜市をもっと歩きやすく、もっと知りやすくするための小さなデジタル実験です。",
  },
  {
    id: "concept",
    title: "迷ってこそが日曜市！",
    description: "だけど、ちょっとだけデジタルの力で「歩きやすく」「探しやすく」しました。",
  },
  {
    id: "map",
    title: "マップ",
    description: "今どこにいるか、近くに何があるか。屋台の位置がすぐにわかります。",
    iconName: "map",
    action: {
      label: "マップを見る",
      href: "/map",
      primary: true,
    },
  },
  {
    id: "search",
    title: "さがす",
    description: "季節の野菜や、あのお店。検索機能でお目当てを見つけやすく。",
    iconName: "spark",
    action: {
      label: "お店を探す",
      href: "/search",
    },
  },
  {
    id: "kotodute",
    title: "ことづて",
    description: "「おいしかった」「ありがとう」。みんなの声が市場をつなぎます。",
    iconName: "chat",
    action: {
      label: "ことづてを見る",
      href: "/kotodute",
    },
  },
  {
    id: "recipe",
    title: "土佐の料理レシピ",
    description: "季節の食材を使った土佐料理のレシピを紹介します。",
    iconName: "recipe",
    action: {
      label: "レシピを見る",
      href: "/recipes",
    },
  },
  {
    id: "event",
    title: "午後のイベント",
    description: "市場が終わった後も楽しめる地域イベントやワークショップを掲載。",
    iconName: "event",
    action: {
      label: "イベントを見る",
      href: "/events",
    },
  },
  {
    id: "everyone",
    title: "みんなのために",
    description: "初めての方も、常連さんも、出店者さんも。それぞれの楽しみ方をサポート。",
    iconName: "route",
  },
  {
    id: "team",
    title: "チームと活動",
    description: "高知高専の学生と教員によるプロジェクト。現地での聞き取りを大切にしています。",
    iconName: "store",
  },
  {
    id: "cta",
    title: "さあ、日曜市へ",
    description: "デジタル片手に、新しい発見を探しに行きませんか？",
    action: {
      label: "マップを見る",
      href: "/map",
      primary: true,
    },
  },
];
