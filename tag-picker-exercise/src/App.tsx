import { useState } from "react";
import { Code2, Moon, Sun } from "lucide-react";
import { TagPicker } from "./TagPicker";
import { MORE_SKILLS, RECOMMENDATIONS, SKILLS } from "./data";

export default function App() {
  const [skills, setSkills] = useState<string[]>(["Figma", "React"]);
  const [dark, setDark] = useState(false);
  return <main className="workspace">
    <header className="app-header">
      <div className="brand"><span className="brand-mark" aria-hidden="true"><Code2 size={26} strokeWidth={1.8} /></span><h1>Tag Picker</h1></div>
      <button type="button" className="theme-switch" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={dark} onClick={() => { setDark(!dark); document.documentElement.classList.toggle("dark", !dark); }}>
        {dark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}<span>{dark ? "Light" : "Dark"}</span>
      </button>
    </header>
    <div className="picker-panel"><TagPicker options={SKILLS} searchOptions={MORE_SKILLS} value={skills} onChange={setSkills} recommendations={RECOMMENDATIONS} maxSkills={10} allowCustom /></div>
  </main>;
}
