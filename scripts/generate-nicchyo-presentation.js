const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "tmp", "nicchyo-presentation");
const PPTX_PATH = path.join(ROOT, "docs", "nicchyo-presentation.pptx");

const SLIDE_W = 12192000;
const SLIDE_H = 6858000;
const EMU_PER_INCH = 914400;

function inch(value) {
  return Math.round(value * EMU_PER_INCH);
}

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(target, content) {
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, content, "utf8");
}

function copyFile(from, to) {
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function colorFill(hex, alpha) {
  if (!hex) {
    return "<a:noFill/>";
  }
  if (typeof alpha === "number" && alpha >= 0 && alpha < 1) {
    return `<a:solidFill><a:srgbClr val="${hex}"><a:alpha val="${Math.round(
      alpha * 100000
    )}"/></a:srgbClr></a:solidFill>`;
  }
  return `<a:solidFill><a:srgbClr val="${hex}"/></a:solidFill>`;
}

function lineFill(hex) {
  if (!hex) {
    return "<a:ln><a:noFill/></a:ln>";
  }
  return `<a:ln><a:solidFill><a:srgbClr val="${hex}"/></a:solidFill></a:ln>`;
}

function buildParagraph(text, style = {}) {
  const size = Math.round((style.size || 20) * 100);
  const font = esc(style.font || "Yu Gothic");
  const color = esc(style.color || "1F2937");
  const align = style.align || "l";
  const bold = style.bold ? ' b="1"' : "";
  const italic = style.italic ? ' i="1"' : "";
  const levelAttr = style.level ? ` lvl="${style.level}"` : "";
  const marLAttr = style.level ? ` marL="${style.level * 342900}"` : "";
  return [
    `<a:p>`,
    `<a:pPr algn="${align}"${levelAttr}${marLAttr}/>`,
    `<a:r>`,
    `<a:rPr lang="ja-JP" sz="${size}"${bold}${italic} dirty="0" smtClean="0">`,
    `<a:solidFill><a:srgbClr val="${color}"/></a:solidFill>`,
    `<a:latin typeface="${font}"/>`,
    `<a:ea typeface="${font}"/>`,
    `<a:cs typeface="${font}"/>`,
    `</a:rPr>`,
    `<a:t>${esc(text)}</a:t>`,
    `</a:r>`,
    `<a:endParaRPr lang="ja-JP" sz="${size}"/>`,
    `</a:p>`,
  ].join("");
}

function createTextShape(id, item) {
  const paragraphs = (item.paragraphs || []).map((p) =>
    buildParagraph(p.text, p)
  );
  if (!paragraphs.length && item.text) {
    paragraphs.push(buildParagraph(item.text, item));
  }
  if (!paragraphs.length) {
    paragraphs.push("<a:p/>");
  }
  const fill = colorFill(item.fill, item.fillAlpha);
  const outline = lineFill(item.line);
  const x = inch(item.x);
  const y = inch(item.y);
  const w = inch(item.w);
  const h = inch(item.h);
  const anchor = item.anchor || "t";
  const shape = item.shape || "rect";
  return [
    `<p:sp>`,
    `<p:nvSpPr>`,
    `<p:cNvPr id="${id}" name="Shape ${id}"/>`,
    `<p:cNvSpPr txBox="1"/>`,
    `<p:nvPr/>`,
    `</p:nvSpPr>`,
    `<p:spPr>`,
    `<a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm>`,
    `<a:prstGeom prst="${shape}"><a:avLst/></a:prstGeom>`,
    fill,
    outline,
    `</p:spPr>`,
    `<p:txBody>`,
    `<a:bodyPr wrap="square" rtlCol="0" anchor="${anchor}" lIns="91440" tIns="45720" rIns="91440" bIns="45720"/>`,
    `<a:lstStyle/>`,
    paragraphs.join(""),
    `</p:txBody>`,
    `</p:sp>`,
  ].join("");
}

function createPictureShape(id, relId, item) {
  return [
    `<p:pic>`,
    `<p:nvPicPr>`,
    `<p:cNvPr id="${id}" name="Picture ${id}"/>`,
    `<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>`,
    `<p:nvPr/>`,
    `</p:nvPicPr>`,
    `<p:blipFill>`,
    `<a:blip r:embed="${relId}"/>`,
    `<a:stretch><a:fillRect/></a:stretch>`,
    `</p:blipFill>`,
    `<p:spPr>`,
    `<a:xfrm><a:off x="${inch(item.x)}" y="${inch(item.y)}"/><a:ext cx="${inch(
      item.w
    )}" cy="${inch(item.h)}"/></a:xfrm>`,
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>`,
    `</p:spPr>`,
    `</p:pic>`,
  ].join("");
}

function buildSlideXml(slide, index, mediaMap) {
  let nextShapeId = 2;
  let relIndex = 2;
  const relationships = [
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>`,
  ];
  const shapes = [];

  if (slide.background) {
    shapes.push(
      `<p:sp><p:nvSpPr><p:cNvPr id="${nextShapeId}" name="Background ${nextShapeId}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${SLIDE_W}" cy="${SLIDE_H}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${colorFill(
        slide.background
      )}<a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>`
    );
    nextShapeId += 1;
  }

  for (const item of slide.items) {
    if (item.type === "image") {
      const media = mediaMap[item.src];
      const relId = `rId${relIndex}`;
      relationships.push(
        `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${media.fileName}"/>`
      );
      shapes.push(createPictureShape(nextShapeId, relId, item));
      relIndex += 1;
      nextShapeId += 1;
      continue;
    }
    if (item.type === "text" || item.type === "shape") {
      shapes.push(createTextShape(nextShapeId, item));
      nextShapeId += 1;
    }
  }

  const slideXml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">`,
    `<p:cSld name="Slide ${index}">`,
    `<p:spTree>`,
    `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`,
    `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`,
    shapes.join(""),
    `</p:spTree>`,
    `</p:cSld>`,
    `<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>`,
    `</p:sld>`,
  ].join("");

  const relsXml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`,
    relationships.join(""),
    `</Relationships>`,
  ].join("");

  return { slideXml, relsXml };
}

function buildContentTypes(slideCount, mediaList) {
  const defaults = [
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`,
    `<Default Extension="xml" ContentType="application/xml"/>`,
  ];
  const extensions = new Set(mediaList.map((m) => m.ext.toLowerCase()));
  for (const ext of extensions) {
    if (ext === ".png") {
      defaults.push(`<Default Extension="png" ContentType="image/png"/>`);
    } else if (ext === ".jpg" || ext === ".jpeg") {
      defaults.push(`<Default Extension="${ext.slice(1)}" ContentType="image/jpeg"/>`);
    }
  }
  const overrides = [
    `<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>`,
    `<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>`,
    `<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>`,
    `<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>`,
    `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>`,
    `<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>`,
  ];
  for (let i = 1; i <= slideCount; i += 1) {
    overrides.push(
      `<Override PartName="/ppt/slides/slide${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
    );
  }
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`,
    defaults.join(""),
    overrides.join(""),
    `</Types>`,
  ].join("");
}

function buildPresentation(slideCount) {
  const slideIdEntries = [];
  const relEntries = [
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>`,
  ];
  for (let i = 1; i <= slideCount; i += 1) {
    const relId = `rId${i + 1}`;
    slideIdEntries.push(`<p:sldId id="${255 + i}" r:id="${relId}"/>`);
    relEntries.push(
      `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i}.xml"/>`
    );
  }

  const presentationXml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1" autoCompressPictures="0">`,
    `<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>`,
    `<p:sldIdLst>${slideIdEntries.join("")}</p:sldIdLst>`,
    `<p:sldSz cx="${SLIDE_W}" cy="${SLIDE_H}" type="screen16x9"/>`,
    `<p:notesSz cx="6858000" cy="9144000"/>`,
    `<p:defaultTextStyle/>`,
    `</p:presentation>`,
  ].join("");

  const relsXml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`,
    relEntries.join(""),
    `</Relationships>`,
  ].join("");

  return { presentationXml, relsXml };
}

function buildMaster() {
  const slideMasterXml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">`,
    `<p:cSld name="Office Theme">`,
    `<p:bg><p:bgPr>${colorFill("F8FAFC")}<a:effectLst/></p:bgPr></p:bg>`,
    `<p:spTree>`,
    `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`,
    `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`,
    `</p:spTree>`,
    `</p:cSld>`,
    `<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>`,
    `<p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst>`,
    `<p:hf/><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>`,
    `</p:sldMaster>`,
  ].join("");

  const relsXml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`,
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>`,
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>`,
    `</Relationships>`,
  ].join("");

  return { slideMasterXml, relsXml };
}

function buildLayout() {
  const slideLayoutXml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">`,
    `<p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>`,
    `<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>`,
    `</p:sldLayout>`,
  ].join("");

  const relsXml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`,
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>`,
    `</Relationships>`,
  ].join("");

  return { slideLayoutXml, relsXml };
}

function buildTheme() {
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="nicchyo Theme">`,
    `<a:themeElements>`,
    `<a:clrScheme name="nicchyo">`,
    `<a:dk1><a:srgbClr val="111827"/></a:dk1>`,
    `<a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>`,
    `<a:dk2><a:srgbClr val="1F2937"/></a:dk2>`,
    `<a:lt2><a:srgbClr val="F8FAFC"/></a:lt2>`,
    `<a:accent1><a:srgbClr val="E76F51"/></a:accent1>`,
    `<a:accent2><a:srgbClr val="2A9D8F"/></a:accent2>`,
    `<a:accent3><a:srgbClr val="F4A261"/></a:accent3>`,
    `<a:accent4><a:srgbClr val="264653"/></a:accent4>`,
    `<a:accent5><a:srgbClr val="E9C46A"/></a:accent5>`,
    `<a:accent6><a:srgbClr val="8AB17D"/></a:accent6>`,
    `<a:hlink><a:srgbClr val="2563EB"/></a:hlink>`,
    `<a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink>`,
    `</a:clrScheme>`,
    `<a:fontScheme name="nicchyo">`,
    `<a:majorFont><a:latin typeface="Aptos Display"/><a:ea typeface="Yu Gothic"/><a:cs typeface="Arial"/></a:majorFont>`,
    `<a:minorFont><a:latin typeface="Aptos"/><a:ea typeface="Yu Gothic"/><a:cs typeface="Arial"/></a:minorFont>`,
    `</a:fontScheme>`,
    `<a:fmtScheme name="nicchyo"><a:fillStyleLst/><a:lnStyleLst/><a:effectStyleLst/><a:bgFillStyleLst/></a:fmtScheme>`,
    `</a:themeElements>`,
    `<a:objectDefaults/><a:extraClrSchemeLst/>`,
    `</a:theme>`,
  ].join("");
}

function buildAppProps(slideCount) {
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">`,
    `<Application>Microsoft Office PowerPoint</Application>`,
    `<PresentationFormat>On-screen Show (16:9)</PresentationFormat>`,
    `<Slides>${slideCount}</Slides>`,
    `<Notes>0</Notes>`,
    `<HiddenSlides>0</HiddenSlides>`,
    `<MMClips>0</MMClips>`,
    `<ScaleCrop>false</ScaleCrop>`,
    `<HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Slides</vt:lpstr></vt:variant><vt:variant><vt:i4>${slideCount}</vt:i4></vt:variant></vt:vector></HeadingPairs>`,
    `<TitlesOfParts><vt:vector size="${slideCount}" baseType="lpstr">${Array.from(
      { length: slideCount },
      (_, i) => `<vt:lpstr>Slide ${i + 1}</vt:lpstr>`
    ).join("")}</vt:vector></TitlesOfParts>`,
    `<Company>nicchyo project</Company>`,
    `<LinksUpToDate>false</LinksUpToDate>`,
    `<SharedDoc>false</SharedDoc>`,
    `<HyperlinksChanged>false</HyperlinksChanged>`,
    `<AppVersion>16.0000</AppVersion>`,
    `</Properties>`,
  ].join("");
}

function buildCoreProps() {
  const now = new Date().toISOString();
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`,
    `<dc:title>nicchyo Presentation</dc:title>`,
    `<dc:subject>nicchyo digital map</dc:subject>`,
    `<dc:creator>Codex</dc:creator>`,
    `<cp:keywords>nicchyo;presentation</cp:keywords>`,
    `<dc:description>Presentation deck for the nicchyo digital map project.</dc:description>`,
    `<cp:lastModifiedBy>Codex</cp:lastModifiedBy>`,
    `<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>`,
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>`,
    `</cp:coreProperties>`,
  ].join("");
}

function buildRootRels() {
  return [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`,
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>`,
    `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>`,
    `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>`,
    `</Relationships>`,
  ].join("");
}

const mediaSources = [
  "public/homepagebackground.png",
  "public/images/home-hero.jpg",
  "public/images/obaasan_transparent.png",
  "public/images/shops/右移動前.png",
  "public/images/shops/右移動後.png",
  "public/images/home/posters/HomePagePoster1.png",
  "public/images/home/posters/HomePagePoster2.png",
  "public/images/home/posters/HomePagePoster4.png",
  "public/images/home/posters/HomePagePoster6.jpeg",
];

const slides = [
  {
    background: "163A5F",
    items: [
      { type: "image", src: "public/homepagebackground.png", x: 0, y: 0, w: 13.333, h: 7.5 },
      { type: "shape", x: 0, y: 0, w: 13.333, h: 7.5, fill: "0F172A", fillAlpha: 0.42, line: null },
      {
        type: "text",
        x: 0.7,
        y: 0.55,
        w: 4.2,
        h: 0.5,
        fill: "E9C46A",
        line: null,
        paragraphs: [{ text: "KOCHI SUNDAY MARKET DIGITAL MAP", size: 12, color: "163A5F", bold: true, align: "ctr" }],
      },
      {
        type: "text",
        x: 0.85,
        y: 1.45,
        w: 7.1,
        h: 2.4,
        line: null,
        paragraphs: [
          { text: "nicchyo", size: 30, color: "FFFFFF", bold: true },
          { text: "日曜市を、安心して歩き始められる場へ。", size: 24, color: "F8FAFC", bold: true },
          { text: "不安を減らし、体験が自然に始まる入口をつくる。", size: 14, color: "E5E7EB" },
        ],
      },
      {
        type: "text",
        x: 8.45,
        y: 4.8,
        w: 3.85,
        h: 1.25,
        fill: "FFFFFF",
        line: null,
        paragraphs: [
          { text: "学生主体で、地域文化を未来へつなぐ", size: 14, color: "1F2937", bold: true },
          { text: "Presentation Deck", size: 11, color: "6B7280" },
        ],
      },
    ],
  },
  {
    background: "F8F5F0",
    items: [
      {
        type: "text",
        x: 0.8,
        y: 0.55,
        w: 6.8,
        h: 1.0,
        line: null,
        paragraphs: [
          { text: "結論", size: 16, color: "E76F51", bold: true },
          { text: "nicchyoは、便利アプリではなく体験の入口を整えるサービスです。", size: 24, color: "111827", bold: true },
        ],
      },
      {
        type: "shape",
        x: 0.8,
        y: 2.0,
        w: 5.7,
        h: 3.8,
        fill: "FFFFFF",
        line: null,
        paragraphs: [
          { text: "目的", size: 14, color: "2A9D8F", bold: true },
          { text: "情報を増やすことではなく、初来訪者の不安や緊張を和らげること。", size: 20, color: "1F2937", bold: true },
          { text: "日曜市の魅力をデジタルに置き換えるのではなく、現地での体験が始まる前段を支える。", size: 13, color: "4B5563" },
        ],
      },
      {
        type: "shape",
        x: 7.0,
        y: 1.7,
        w: 5.0,
        h: 1.35,
        fill: "264653",
        line: null,
        paragraphs: [{ text: "1 slide, 1 message", size: 18, color: "FFFFFF", bold: true, align: "ctr" }],
      },
      {
        type: "shape",
        x: 7.0,
        y: 3.3,
        w: 2.3,
        h: 2.2,
        fill: "E9C46A",
        line: null,
        paragraphs: [{ text: "安心", size: 24, color: "163A5F", bold: true, align: "ctr" }],
      },
      {
        type: "shape",
        x: 9.7,
        y: 3.3,
        w: 2.3,
        h: 2.2,
        fill: "2A9D8F",
        line: null,
        paragraphs: [{ text: "開始", size: 24, color: "FFFFFF", bold: true, align: "ctr" }],
      },
    ],
  },
  {
    background: "FFFDF8",
    items: [
      { type: "image", src: "public/images/home-hero.jpg", x: 6.9, y: 0.7, w: 5.6, h: 5.8 },
      {
        type: "text",
        x: 0.8,
        y: 0.7,
        w: 5.5,
        h: 1.0,
        line: null,
        paragraphs: [
          { text: "日曜市の価値", size: 16, color: "E76F51", bold: true },
          { text: "歩いて、見つけて、話して初めて立ち上がる。", size: 24, color: "111827", bold: true },
        ],
      },
      {
        type: "shape",
        x: 0.8,
        y: 2.0,
        w: 5.4,
        h: 3.6,
        fill: "FFFFFF",
        line: null,
        paragraphs: [
          { text: "300年以上続く高知の日曜市は、商品情報だけでは伝わらない地域文化です。", size: 18, color: "1F2937", bold: true },
          { text: "空気感、寄り道、出店者との会話。その体験自体が価値になります。", size: 14, color: "4B5563" },
          { text: "だからこそ、デジタルは主役ではなく“入口”であるべきです。", size: 14, color: "4B5563" },
        ],
      },
    ],
  },
  {
    background: "F9FAFB",
    items: [
      {
        type: "text",
        x: 0.8,
        y: 0.6,
        w: 7.4,
        h: 0.9,
        line: null,
        paragraphs: [
          { text: "来場者の課題", size: 16, color: "E76F51", bold: true },
          { text: "初来訪者は、情報不足より先に“緊張”でつまずく。", size: 24, color: "111827", bold: true },
        ],
      },
      {
        type: "shape",
        x: 0.9,
        y: 2.1,
        w: 3.7,
        h: 3.2,
        fill: "FFFFFF",
        line: null,
        paragraphs: [
          { text: "規模感が分からない", size: 20, color: "163A5F", bold: true, align: "ctr" },
          { text: "どこから歩けばよいか想像できず、最初の一歩が重くなる。", size: 13, color: "4B5563" },
        ],
      },
      {
        type: "shape",
        x: 4.8,
        y: 2.1,
        w: 3.7,
        h: 3.2,
        fill: "FFFFFF",
        line: null,
        paragraphs: [
          { text: "興味の向き先が曖昧", size: 20, color: "2A9D8F", bold: true, align: "ctr" },
          { text: "気になるものがあっても、どう探せばよいか言語化しにくい。", size: 13, color: "4B5563" },
        ],
      },
      {
        type: "shape",
        x: 8.7,
        y: 2.1,
        w: 3.7,
        h: 3.2,
        fill: "FFFFFF",
        line: null,
        paragraphs: [
          { text: "疲れて終わりやすい", size: 20, color: "E76F51", bold: true, align: "ctr" },
          { text: "不安を抱えたまま歩き続けると、楽しさより疲労感が残る。", size: 13, color: "4B5563" },
        ],
      },
    ],
  },
  {
    background: "163A5F",
    items: [
      { type: "shape", x: 0, y: 0, w: 6.2, h: 7.5, fill: "0F172A", line: null },
      { type: "image", src: "public/images/home/posters/HomePagePoster6.jpeg", x: 7.8, y: 0.8, w: 4.0, h: 5.8 },
      {
        type: "text",
        x: 0.8,
        y: 0.8,
        w: 4.8,
        h: 1.1,
        line: null,
        paragraphs: [
          { text: "既存のデジタル化の限界", size: 16, color: "E9C46A", bold: true },
          { text: "従来の観光マップは、日曜市には説明しすぎる。", size: 24, color: "FFFFFF", bold: true },
        ],
      },
      {
        type: "text",
        x: 0.9,
        y: 2.3,
        w: 4.6,
        h: 3.0,
        line: null,
        paragraphs: [
          { text: "情報を詰め込むほど、現地での余白が消える。", size: 18, color: "E5E7EB", bold: true },
          { text: "最短ルートや比較前提の設計は、寄り道や偶然の出会いを削ぎ落とす。", size: 14, color: "CBD5E1" },
          { text: "nicchyoは“効率化”よりも“体験の始まり”を優先する。", size: 14, color: "CBD5E1" },
        ],
      },
    ],
  },
];

slides.push(
  {
    background: "FFF7ED",
    items: [
      {
        type: "text",
        x: 0.8,
        y: 0.55,
        w: 7.0,
        h: 1.0,
        line: null,
        paragraphs: [
          { text: "設計思想", size: 16, color: "E76F51", bold: true },
          { text: "不安・緊張を、安心へ変える。", size: 26, color: "111827", bold: true },
        ],
      },
      { type: "shape", x: 1.0, y: 2.0, w: 3.2, h: 2.6, fill: "FFFFFF", line: null, paragraphs: [{ text: "不安", size: 30, color: "E76F51", bold: true, align: "ctr" }] },
      { type: "text", x: 4.55, y: 2.55, w: 1.1, h: 0.7, line: null, paragraphs: [{ text: "→", size: 32, color: "264653", bold: true, align: "ctr" }] },
      { type: "shape", x: 6.0, y: 2.0, w: 3.2, h: 2.6, fill: "E9C46A", line: null, paragraphs: [{ text: "安心", size: 30, color: "163A5F", bold: true, align: "ctr" }] },
      {
        type: "text",
        x: 9.7,
        y: 2.15,
        w: 2.2,
        h: 2.4,
        line: null,
        paragraphs: [
          { text: "探索や会話は", size: 17, color: "1F2937", bold: true },
          { text: "安心の先に自然と生まれる。", size: 17, color: "1F2937", bold: true },
        ],
      },
    ],
  },
  {
    background: "F1F5F9",
    items: [
      {
        type: "shape",
        x: 0.9,
        y: 1.0,
        w: 11.5,
        h: 4.8,
        fill: "FFFFFF",
        line: null,
        paragraphs: [
          { text: "「迷わないようにする」のではなく、", size: 24, color: "64748B", align: "ctr" },
          { text: "「迷いを楽しめる状態をつくる」", size: 30, color: "163A5F", bold: true, align: "ctr" },
          { text: "迷いは日曜市の魅力の一部。消すべきなのは、迷いそのものではなく不安です。", size: 14, color: "475569", align: "ctr" },
        ],
      },
      { type: "shape", x: 5.55, y: 5.95, w: 2.2, h: 0.5, fill: "E9C46A", line: null },
    ],
  },
  {
    background: "FFFFFF",
    items: [
      {
        type: "text",
        x: 0.75,
        y: 0.55,
        w: 7.5,
        h: 1.0,
        line: null,
        paragraphs: [
          { text: "体験導線", size: 16, color: "E76F51", bold: true },
          { text: "検索 → 相談 → 会話 の流れを自然につくる。", size: 24, color: "111827", bold: true },
        ],
      },
      { type: "shape", x: 0.9, y: 2.2, w: 3.3, h: 2.8, fill: "F8FAFC", line: null, paragraphs: [{ text: "検索", size: 24, color: "163A5F", bold: true, align: "ctr" }, { text: "明確な条件で確実に知りたい。", size: 13, color: "475569", align: "ctr" }] },
      { type: "text", x: 4.35, y: 3.15, w: 0.8, h: 0.5, line: null, paragraphs: [{ text: "→", size: 28, color: "94A3B8", bold: true, align: "ctr" }] },
      { type: "shape", x: 5.2, y: 2.2, w: 3.3, h: 2.8, fill: "F0FDF4", line: null, paragraphs: [{ text: "相談", size: 24, color: "2A9D8F", bold: true, align: "ctr" }, { text: "曖昧で言葉にしづらい迷いを受け止める。", size: 13, color: "475569", align: "ctr" }] },
      { type: "text", x: 8.65, y: 3.15, w: 0.8, h: 0.5, line: null, paragraphs: [{ text: "→", size: 28, color: "94A3B8", bold: true, align: "ctr" }] },
      { type: "shape", x: 9.5, y: 2.2, w: 2.9, h: 2.8, fill: "FFF7ED", line: null, paragraphs: [{ text: "会話", size: 24, color: "E76F51", bold: true, align: "ctr" }, { text: "最後は現地の人とのやりとりへ。", size: 13, color: "475569", align: "ctr" }] },
    ],
  },
  {
    background: "F8FAFC",
    items: [
      { type: "image", src: "public/images/shops/右移動前.png", x: 7.7, y: 1.15, w: 2.25, h: 4.7 },
      { type: "image", src: "public/images/shops/右移動後.png", x: 10.0, y: 1.15, w: 2.25, h: 4.7 },
      {
        type: "text",
        x: 0.8,
        y: 0.55,
        w: 6.2,
        h: 1.0,
        line: null,
        paragraphs: [
          { text: "主機能 1 | Webデジタルマップ", size: 16, color: "2A9D8F", bold: true },
          { text: "全体像がつかめるだけで、人は歩き出しやすくなる。", size: 24, color: "111827", bold: true },
        ],
      },
      {
        type: "shape",
        x: 0.8,
        y: 2.0,
        w: 5.8,
        h: 3.6,
        fill: "FFFFFF",
        line: null,
        paragraphs: [
          { text: "マップは最短ルートのためではなく、安心して歩き始めるための俯瞰図。", size: 19, color: "1F2937", bold: true },
          { text: "市場全体の範囲・構造・雰囲気を、スマホのブラウザ上で直感的に把握できる。", size: 13, color: "4B5563" },
        ],
      },
      { type: "text", x: 7.7, y: 6.1, w: 4.6, h: 0.45, line: null, paragraphs: [{ text: "実装画面イメージ", size: 11, color: "64748B", align: "ctr" }] },
    ],
  },
  {
    background: "FFFBEB",
    items: [
      { type: "image", src: "public/images/home/posters/HomePagePoster1.png", x: 8.85, y: 0.75, w: 2.6, h: 5.9 },
      {
        type: "text",
        x: 0.8,
        y: 0.55,
        w: 6.8,
        h: 1.0,
        line: null,
        paragraphs: [
          { text: "主機能 2 | 検索", size: 16, color: "E76F51", bold: true },
          { text: "“確実に知りたい”には、シンプルに応える。", size: 24, color: "111827", bold: true },
        ],
      },
      {
        type: "shape",
        x: 0.9,
        y: 2.0,
        w: 6.8,
        h: 3.8,
        fill: "FFFFFF",
        line: null,
        paragraphs: [
          { text: "カテゴリや条件での絞り込みにより、明確なニーズには即答できる導線を用意。", size: 18, color: "1F2937", bold: true },
          { text: "ただし、情報を増やしすぎて現地体験を代替しないよう、見せる情報は最小限に保つ。", size: 13, color: "4B5563" },
        ],
      },
      { type: "shape", x: 8.15, y: 1.8, w: 3.55, h: 0.6, fill: "264653", line: null, paragraphs: [{ text: "Search UI Visual", size: 12, color: "FFFFFF", bold: true, align: "ctr" }] },
    ],
  }
);

slides.push(
  {
    background: "F0FDF4",
    items: [
      { type: "image", src: "public/images/obaasan_transparent.png", x: 8.7, y: 1.35, w: 3.2, h: 4.5 },
      {
        type: "text",
        x: 0.8,
        y: 0.55,
        w: 6.9,
        h: 1.0,
        line: null,
        paragraphs: [
          { text: "主機能 3 | AI案内役「にちよさん」", size: 16, color: "2A9D8F", bold: true },
          { text: "言葉にしにくい不安を受け止める案内役がいる。", size: 24, color: "111827", bold: true },
        ],
      },
      { type: "shape", x: 0.9, y: 2.0, w: 6.8, h: 1.2, fill: "FFFFFF", line: null, paragraphs: [{ text: "「初めてで、どこから歩けばいいか迷う」", size: 16, color: "1F2937" }] },
      { type: "shape", x: 1.4, y: 3.45, w: 6.3, h: 1.2, fill: "D1FAE5", line: null, paragraphs: [{ text: "「まずは気になる通りからゆっくりで大丈夫。気になるお店があれば、その場で聞いてみましょう。」", size: 15, color: "065F46" }] },
      { type: "text", x: 0.95, y: 5.25, w: 6.8, h: 0.8, line: null, paragraphs: [{ text: "断定せず、急かさず、検索と現地の会話のあいだをつなぐ存在。", size: 13, color: "475569" }] },
    ],
  },
  {
    background: "FFF7ED",
    items: [
      { type: "image", src: "public/images/shops/右移動前.png", x: 6.9, y: 1.45, w: 2.35, h: 4.4 },
      { type: "image", src: "public/images/shops/右移動後.png", x: 9.45, y: 1.45, w: 2.35, h: 4.4 },
      {
        type: "text",
        x: 0.8,
        y: 0.55,
        w: 5.8,
        h: 1.0,
        line: null,
        paragraphs: [
          { text: "主機能 4 | ショップバナー", size: 16, color: "E76F51", bold: true },
          { text: "店の情報は、会話のきっかけになる最小限でよい。", size: 24, color: "111827", bold: true },
        ],
      },
      {
        type: "shape",
        x: 0.9,
        y: 2.0,
        w: 5.3,
        h: 3.8,
        fill: "FFFFFF",
        line: null,
        paragraphs: [
          { text: "店舗名・カテゴリ・短い紹介文に絞ることで、知りすぎて終わることを防ぐ。", size: 18, color: "1F2937", bold: true },
          { text: "会話や発見を妨げない“余白”が、バナーの価値。", size: 13, color: "4B5563" },
        ],
      },
    ],
  },
  {
    background: "FFFFFF",
    items: [
      {
        type: "text",
        x: 0.8,
        y: 0.55,
        w: 7.0,
        h: 1.0,
        line: null,
        paragraphs: [
          { text: "生まれる価値", size: 16, color: "2A9D8F", bold: true },
          { text: "来場者・出店者・地域の接点を、無理なく増やす。", size: 24, color: "111827", bold: true },
        ],
      },
      { type: "shape", x: 0.9, y: 2.0, w: 3.7, h: 3.7, fill: "F8FAFC", line: null, paragraphs: [{ text: "来場者", size: 22, color: "163A5F", bold: true, align: "ctr" }, { text: "安心して歩き始められる。", size: 14, color: "4B5563", align: "ctr" }] },
      { type: "shape", x: 4.8, y: 2.0, w: 3.7, h: 3.7, fill: "F0FDF4", line: null, paragraphs: [{ text: "出店者", size: 22, color: "2A9D8F", bold: true, align: "ctr" }, { text: "新規来場者との自然な接点が増える。", size: 14, color: "4B5563", align: "ctr" }] },
      { type: "shape", x: 8.7, y: 2.0, w: 3.7, h: 3.7, fill: "FFF7ED", line: null, paragraphs: [{ text: "地域", size: 22, color: "E76F51", bold: true, align: "ctr" }, { text: "文化の魅力を、体験として伝えやすくなる。", size: 14, color: "4B5563", align: "ctr" }] },
    ],
  },
  {
    background: "F8FAFC",
    items: [
      {
        type: "text",
        x: 0.8,
        y: 0.55,
        w: 7.4,
        h: 1.0,
        line: null,
        paragraphs: [
          { text: "プロジェクトの意義", size: 16, color: "E76F51", bold: true },
          { text: "学生が地域文化に継続的に関わる、実践の場でもある。", size: 24, color: "111827", bold: true },
        ],
      },
      { type: "shape", x: 1.0, y: 2.4, w: 11.0, h: 0.14, fill: "CBD5E1", line: null },
      { type: "shape", x: 1.2, y: 1.95, w: 1.3, h: 0.9, fill: "163A5F", line: null, paragraphs: [{ text: "2025.07", size: 13, color: "FFFFFF", bold: true, align: "ctr" }] },
      { type: "shape", x: 3.7, y: 1.95, w: 1.3, h: 0.9, fill: "2A9D8F", line: null, paragraphs: [{ text: "2025.08", size: 13, color: "FFFFFF", bold: true, align: "ctr" }] },
      { type: "shape", x: 6.2, y: 1.95, w: 1.3, h: 0.9, fill: "E9C46A", line: null, paragraphs: [{ text: "2025.10", size: 13, color: "163A5F", bold: true, align: "ctr" }] },
      { type: "shape", x: 8.7, y: 1.95, w: 1.3, h: 0.9, fill: "E76F51", line: null, paragraphs: [{ text: "2026.01", size: 13, color: "FFFFFF", bold: true, align: "ctr" }] },
      {
        type: "text",
        x: 0.95,
        y: 3.0,
        w: 11.2,
        h: 2.8,
        line: null,
        paragraphs: [
          { text: "高知市との協議、re-KOSEN採択、現地アンケート、中間報告、最終報告へ。", size: 18, color: "1F2937", bold: true },
          { text: "単発の制作ではなく、部活動として知識と関係性を継承していく。", size: 13, color: "4B5563" },
        ],
      },
    ],
  },
  {
    background: "163A5F",
    items: [
      { type: "image", src: "public/images/home/posters/HomePagePoster2.png", x: 7.6, y: 0.8, w: 2.2, h: 5.9 },
      { type: "image", src: "public/images/home/posters/HomePagePoster4.png", x: 9.95, y: 0.8, w: 2.2, h: 5.9 },
      {
        type: "text",
        x: 0.85,
        y: 1.0,
        w: 5.8,
        h: 1.2,
        line: null,
        paragraphs: [
          { text: "未来", size: 16, color: "E9C46A", bold: true },
          { text: "“分かりやすさ”ではなく、“また来たくなる体験”を増やす。", size: 24, color: "FFFFFF", bold: true },
        ],
      },
      {
        type: "text",
        x: 0.9,
        y: 3.0,
        w: 5.8,
        h: 2.3,
        line: null,
        paragraphs: [
          { text: "nicchyoは、日曜市の魅力をデジタルに置き換えない。", size: 18, color: "E5E7EB", bold: true },
          { text: "その魅力がきちんと始まるように、入口を整える。", size: 18, color: "E5E7EB", bold: true },
          { text: "地域文化を未来につなぐ、小さくても本質的な支え。", size: 14, color: "CBD5E1" },
        ],
      },
    ],
  }
);

function main() {
  removeDir(OUT_DIR);
  ensureDir(path.join(OUT_DIR, "_rels"));
  ensureDir(path.join(OUT_DIR, "docProps"));
  ensureDir(path.join(OUT_DIR, "ppt", "_rels"));
  ensureDir(path.join(OUT_DIR, "ppt", "slides", "_rels"));
  ensureDir(path.join(OUT_DIR, "ppt", "slideLayouts", "_rels"));
  ensureDir(path.join(OUT_DIR, "ppt", "slideMasters", "_rels"));
  ensureDir(path.join(OUT_DIR, "ppt", "theme"));
  ensureDir(path.join(OUT_DIR, "ppt", "media"));

  const mediaMap = {};
  const mediaList = [];
  mediaSources.forEach((src, index) => {
    const sourcePath = path.join(ROOT, src);
    const ext = path.extname(src).toLowerCase();
    const fileName = `image${index + 1}${ext}`;
    const target = path.join(OUT_DIR, "ppt", "media", fileName);
    copyFile(sourcePath, target);
    mediaMap[src] = { fileName, ext };
    mediaList.push({ fileName, ext });
  });

  writeFile(path.join(OUT_DIR, "[Content_Types].xml"), buildContentTypes(slides.length, mediaList));
  writeFile(path.join(OUT_DIR, "_rels", ".rels"), buildRootRels());
  writeFile(path.join(OUT_DIR, "docProps", "app.xml"), buildAppProps(slides.length));
  writeFile(path.join(OUT_DIR, "docProps", "core.xml"), buildCoreProps());

  const { presentationXml, relsXml: presRels } = buildPresentation(slides.length);
  writeFile(path.join(OUT_DIR, "ppt", "presentation.xml"), presentationXml);
  writeFile(path.join(OUT_DIR, "ppt", "_rels", "presentation.xml.rels"), presRels);

  const { slideMasterXml, relsXml: masterRels } = buildMaster();
  writeFile(path.join(OUT_DIR, "ppt", "slideMasters", "slideMaster1.xml"), slideMasterXml);
  writeFile(path.join(OUT_DIR, "ppt", "slideMasters", "_rels", "slideMaster1.xml.rels"), masterRels);

  const { slideLayoutXml, relsXml: layoutRels } = buildLayout();
  writeFile(path.join(OUT_DIR, "ppt", "slideLayouts", "slideLayout1.xml"), slideLayoutXml);
  writeFile(path.join(OUT_DIR, "ppt", "slideLayouts", "_rels", "slideLayout1.xml.rels"), layoutRels);
  writeFile(path.join(OUT_DIR, "ppt", "theme", "theme1.xml"), buildTheme());

  slides.forEach((slide, index) => {
    const { slideXml, relsXml } = buildSlideXml(slide, index + 1, mediaMap);
    writeFile(path.join(OUT_DIR, "ppt", "slides", `slide${index + 1}.xml`), slideXml);
    writeFile(path.join(OUT_DIR, "ppt", "slides", "_rels", `slide${index + 1}.xml.rels`), relsXml);
  });

  console.log(`Prepared PPTX source at ${OUT_DIR}`);
  console.log(`Target archive path: ${PPTX_PATH}`);
}

main();
