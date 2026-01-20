
import { problems } from "../app/(public)/automaton/data";

const generateMarkdown = () => {
  let md = "# グラフとオートマトン問題集 - 完全解答・解説\n\n";
  md += "このドキュメントは、計算複雑性理論およびオートマトン理論に関する全問題の解答と、厳密な数学的証明をまとめたものです。\n\n---\n\n";

  problems.forEach((p) => {
    md += `## 問題 ${p.id}\n\n`;
    md += `**${p.question}**\n\n`;
    md += `### 解答\n${p.answer}\n\n`;
    md += `### 解説\n${p.explanation}\n\n`;
    md += `### 正式な証明\n\`\`\`\n${p.formalProof}\n\`\`\`\n\n---\n\n`;
  });

  console.log(md);
};

generateMarkdown();
