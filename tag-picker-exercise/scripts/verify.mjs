import assert from "node:assert/strict";
import fs from "node:fs";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
try {
  const { default: App } = await server.ssrLoadModule("/src/App.tsx");
  const { TagPicker } = await server.ssrLoadModule("/src/TagPicker.tsx");
  const tags = await server.ssrLoadModule("/src/lib/tags.ts");
  const { SKILLS, MORE_SKILLS, RECOMMENDATIONS } = await server.ssrLoadModule("/src/data.ts");
  const html = renderToStaticMarkup(createElement(App));
  assert(html.includes("<h1>Tag Picker</h1>"));
  const sections = ["Find Skills", "Selected Skills", "Suggested Skills", "Discover More Skills"];
  const positions = sections.map(label => html.indexOf(`>${label}<`));
  assert(positions.every((p, i) => p >= 0 && (!i || p > positions[i - 1])));
  assert(html.includes('aria-label="Remove Figma"'));
  assert(html.includes('aria-label="Remove React"'));
  assert(html.includes('aria-label="2 of 10 skills selected"'));
  assert(html.includes('role="combobox"'));
  assert(html.includes('aria-expanded="false"'));
  assert(!/skills\.config|Local workspace|sample popularity|100 characters/.test(html));
  const uncontrolled = renderToStaticMarkup(createElement(TagPicker, { options: SKILLS, defaultValue: ["Figma"], name: "skills", maxSkills: 10 }));
  assert(uncontrolled.includes('name="skills" value="Figma"'));
  assert(uncontrolled.includes('aria-label="Remove Figma"'));
  const empty = renderToStaticMarkup(createElement(TagPicker, { options: SKILLS, maxSkills: 10 }));
  assert(empty.includes("No skills yet."));
  const all = [...SKILLS, ...MORE_SKILLS];
  assert(all.every(o => o.category && o.category !== "Other / Custom"));
  assert.equal(tags.canonicalTagFor("  rEaCt ", all), "React");
  assert.equal(tags.canonicalTagFor("setup figma", all), "Figma setup");
  assert.equal(tags.tagSlug("  Custom   Skill "), "custom skill");
  for (const [query, expected] of [["F", "Figma"], ["android", "Jetpack Compose"], ["sitemap", "Information architecture"], ["plugins", "Figma setup"], ["theme", "Design tokens"]]) {
    assert(tags.matchTagOptions(query, all).some(o => o.value === expected));
  }
  assert(tags.recommendTags(["Figma", "React"], RECOMMENDATIONS).includes("TypeScript"));
  const held = ["Figma", "React", ...Array.from({ length: 7 }, (_, i) => `Custom ${i}`)];
  assert.deepEqual(tags.fitTagAdditions([...held, "Python", "Swift"], held, 10), [...held, "Python"]);
  assert.deepEqual(tags.fitTagAdditions([...held, "Python", "Swift"], [...held, "Python"], 10), [...held, "Python"]);
  assert.deepEqual(tags.fitTagAdditions([...held.slice(1), "Swift", "Python"], held, 10), [...held.slice(1), "Swift", "Python"]);
  const over = Array.from({ length: 12 }, (_, i) => `Existing ${i}`);
  assert.deepEqual(tags.fitTagAdditions(over.slice(1), over, 10), over.slice(1));
  assert(fs.readFileSync("index.html", "utf8").includes("<title>Tag Picker</title>"));
  assert(fs.existsSync("public/favicon.svg"));
  assert.equal(fs.readFileSync("public/favicon.ico").readUInt16LE(2), 1);
  console.log("PASS: server-rendered title, section order, initial selections, count, empty and uncontrolled states; search/aliases, categories, canonical matching, recommendations, cap, partial additions, removal/replacement, favicon files.");
  console.log("These checks do not exercise browser events, appearance, mobile layout, or the console.");
} finally {
  await server.close();
}
