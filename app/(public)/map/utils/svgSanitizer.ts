const MAX_SVG_LENGTH = 8000;

const ALLOWED_TAGS = new Set([
  "svg",
  "g",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
  "defs",
  "clipPath",
  "linearGradient",
  "radialGradient",
  "stop",
  "use",
]);

const ALLOWED_ATTRIBUTES = new Set([
  "xmlns",
  "viewBox",
  "width",
  "height",
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "opacity",
  "transform",
  "d",
  "x",
  "y",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "x1",
  "x2",
  "y1",
  "y2",
  "points",
  "id",
  "class",
  "className",
  "role",
  "aria-hidden",
  "preserveAspectRatio",
  "gradientUnits",
  "offset",
  "stop-color",
  "stop-opacity",
  "href",
  "xlink:href",
]);

const BLOCKED_PATTERNS = [
  /<\s*script\b/i,
  /<\s*iframe\b/i,
  /<\s*object\b/i,
  /<\s*embed\b/i,
  /<\s*link\b/i,
  /<\s*foreignObject\b/i,
  /\bon[a-z]+\s*=/i,
  /javascript\s*:/i,
  /data\s*:\s*text\/html/i,
  /<\s*style\b/i,
  /<\s*audio\b/i,
  /<\s*video\b/i,
  /<\s*image\b/i,
];

export function sanitizeInlineSvg(input?: string | null): string | null {
  if (!input) return null;

  const candidate = input.trim();
  if (!candidate) return null;
  if (candidate.length > MAX_SVG_LENGTH) return null;
  if (!candidate.startsWith("<svg") || !candidate.endsWith("</svg>")) return null;

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(candidate)) return null;
  }

  const tagMatches = candidate.matchAll(/<\/?([a-zA-Z][\w:-]*)\b[^>]*>/g);
  for (const match of tagMatches) {
    const tagName = match[1];
    const lowerTag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tagName) && !ALLOWED_TAGS.has(lowerTag)) {
      return null;
    }
  }

  const attrMatches = candidate.matchAll(/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(["'])/g);
  for (const match of attrMatches) {
    const attrName = match[1];
    if (attrName.toLowerCase().startsWith("on")) return null;
    if (!ALLOWED_ATTRIBUTES.has(attrName) && !ALLOWED_ATTRIBUTES.has(attrName.toLowerCase())) {
      return null;
    }
  }

  return candidate;
}