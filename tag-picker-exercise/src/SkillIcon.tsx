import { Code2, LayoutDashboard, Layers, PenTool, Search, Server, Smartphone, Tag, type LucideIcon } from "lucide-react";
import { tagSlug, type TagCategory } from "./lib/tags";

type BrandIcon = { asset: string; monochrome?: boolean };

/** Local brand artwork; keys use the same normalization as selected skills. */
export const SKILL_BRAND_ICONS: Readonly<Record<string, BrandIcon>> = {
  figma: { asset: "figma" },
  "figma setup": { asset: "figma" },
  react: { asset: "react" },
  "react native": { asset: "reactnative" },
  typescript: { asset: "typescript" },
  javascript: { asset: "javascript" },
  storybook: { asset: "storybook" },
  webflow: { asset: "webflow" },
  angular: { asset: "angular" },
  css: { asset: "css3" },
  html: { asset: "html5" },
  "next.js": { asset: "nextjs", monochrome: true },
  "node.js": { asset: "nodejs" },
  python: { asset: "python" },
  svelte: { asset: "svelte" },
  swift: { asset: "swift" },
  "tailwind css": { asset: "tailwindcss" },
  vue: { asset: "vuejs" },
  graphql: { asset: "graphql" },
  "adobe illustrator": { asset: "illustrator" },
  "after effects": { asset: "aftereffects" },
  blender: { asset: "blender" },
  photoshop: { asset: "photoshop" },
  sketch: { asset: "sketch" },
  framer: { asset: "framer", monochrome: true },
  "jetpack compose": { asset: "jetpackcompose" },
  "three.js": { asset: "threejs", monochrome: true },
  lottie: { asset: "lottie", monochrome: true },
};

/** Exhaustive category mapping keeps fallbacks deliberate as categories evolve. */
const CATEGORY_ICONS: Record<TagCategory, LucideIcon> = {
  Frontend: LayoutDashboard,
  Backend: Server,
  "Programming Languages": Code2,
  "Design & Prototyping": PenTool,
  "Tools & Frameworks": Layers,
  "UX & Research": Search,
  Mobile: Smartphone,
  "Other / Custom": Tag,
};

export function SkillIcon({ skill, category = "Other / Custom" }: { skill: string; category?: TagCategory }) {
  const key = tagSlug(skill);
  const brand = Object.hasOwn(SKILL_BRAND_ICONS, key) ? SKILL_BRAND_ICONS[key] : undefined;
  const Fallback = CATEGORY_ICONS[category] ?? Tag;
  return <span className="skill-emblem" aria-hidden="true">
    {brand
      ? <img className={`skill-brand-icon${brand.monochrome ? " monochrome" : ""}`} src={`/skill-icons/${brand.asset}.svg`} alt="" width={22} height={22} draggable={false} />
      : <Fallback size={22} strokeWidth={1.8} />}
  </span>;
}
