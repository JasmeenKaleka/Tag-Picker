import { useId, useRef, useState } from "react";
import { SkillIcon } from "./SkillIcon";
import { Check, Compass, Layers, Monitor, Plus, Search, Sparkles, X } from "lucide-react";
import { canonicalTagFor, fitTagAdditions, matchTagOptions, recommendTags, tagSlug, type TagOption, type TagRecommendations } from "./lib/tags";

type Option = string | TagOption;
const shape = (option: Option): TagOption => typeof option === "string" ? { value: option, label: option } : option;

export function TagPicker({ options, searchOptions = [], name, value, defaultValue = [], onChange, allowCustom = false, maxTagLength = 30, maxSkills, recommendations, inputPlaceholder = "Search or add a skill…", className }: {
  options: readonly Option[];
  searchOptions?: readonly Option[];
  name?: string;
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  allowCustom?: boolean;
  maxTagLength?: number;
  /** New additions are capped; existing selections are never discarded. */
  maxSkills?: number;
  recommendations?: TagRecommendations;
  inputPlaceholder?: string;
  className?: string;
}) {
  const opts = options.map(shape);
  const searchable = [...new Map([...opts, ...searchOptions.map(shape)].map(o => [tagSlug(o.value), o])).values()];
  const [internal, setInternal] = useState(defaultValue);
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Keep a clicked recommendation visible so it can be toggled off in place.
  const [pinnedSuggestions, setPinnedSuggestions] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const selected = value ?? internal;
  const optionFor = (tag: string) => searchable.find(o => tagSlug(o.value) === tagSlug(tag));
  const labelFor = (tag: string) => optionFor(tag)?.label ?? tag;
  const categoryFor = (tag: string) => optionFor(tag)?.category ?? "Other / Custom";
  const has = (tag: string) => selected.some(item => tagSlug(item) === tagSlug(tag));
  const commit = (tags: string[]) => {
    const seen = new Set<string>();
    const unique = tags.filter(tag => {
      const slug = tagSlug(tag);
      if (!slug || seen.has(slug)) return false;
      seen.add(slug);
      return true;
    });
    const fitted = maxSkills === undefined ? unique : fitTagAdditions(unique, selected, maxSkills);
    setMessage(fitted.length < unique.length ? `Limit: ${maxSkills} skills. Extra entries skipped; remove one to add another.` : "");
    if (value === undefined) setInternal(fitted);
    onChange?.(fitted);
  };
  const remove = (tag: string) => commit(selected.filter(item => tagSlug(item) !== tagSlug(tag)));
  const toggle = (tag: string) => has(tag) ? remove(tag) : commit([...selected, tag]);
  const close = () => { setOpen(false); setActive(-1); };
  const addDraft = (raw: string) => {
    const next = [...selected];
    let tooLong = false;
    for (const text of raw.split(",").map(t => t.trim().replace(/\s+/g, " ")).filter(Boolean)) {
      const canonical = canonicalTagFor(text, searchable);
      if (canonical) next.push(canonical);
      else if (allowCustom && text.length <= maxTagLength) next.push(text);
      else if (allowCustom) tooLong = true;
    }
    commit(next);
    if (tooLong) setMessage(`Custom labels: ${maxTagLength} characters max.${maxSkills !== undefined ? ` Up to ${maxSkills} skills; extra entries skipped.` : ""}`);
    setDraft("");
    close();
  };
  const q = (draft.split(",").at(-1) ?? "").trim();
  const matches = q ? matchTagOptions(q, searchable, { catalog: new Set(opts.map(o => o.value)) }) : [];
  const expanded = open && Boolean(q);
  const activeIndex = expanded && active >= 0 && active < matches.length ? active : -1;
  const chooseSuggestion = (option: TagOption) => {
    const entries = draft.split(",");
    entries[entries.length - 1] = option.label;
    addDraft(entries.join(","));
    input.current?.focus();
  };
  const moveActive = (index: number) => {
    setActive(index);
    document.getElementById(`${id}-option-${index}`)?.scrollIntoView({ block: "nearest" });
  };
  const categories = ["All", ...new Set(opts.map(o => o.category ?? "Other / Custom"))];
  const browsing = opts.filter(o => category === "All" || (o.category ?? "Other / Custom") === category);
  const groups = [...new Set(browsing.map(o => o.category ?? "Other / Custom"))];
  const recommended = recommendations ? [...new Set([...pinnedSuggestions, ...recommendTags(selected, recommendations, 6)])].slice(0, 6) : [];
  const atLimit = maxSkills !== undefined && selected.length >= maxSkills;
  const pill = (option: TagOption, suggested = false) => <button key={option.value} type="button" className="skill-option" aria-pressed={has(option.value)} aria-disabled={atLimit && !has(option.value)} onClick={() => {
    if (suggested && !has(option.value) && !atLimit) setPinnedSuggestions(previous => [...new Set([...previous, option.value])].slice(-6));
    toggle(option.value);
  }}>{has(option.value) ? <Check size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}<span>{option.label}</span></button>;

  return <div className={className}>
    {name && <input type="hidden" name={name} value={selected.join(",")} />}
    <div className="primary-card">
    <section className="search-section" aria-labelledby={`${id}-search`}>
      <label id={`${id}-search`} htmlFor={`${id}-input`} className="section-title"><span className="section-icon" aria-hidden="true"><Search size={18} /></span><span>Find Skills</span></label>
      <div className="search-anchor">
        <form className="search-field" onSubmit={event => { event.preventDefault(); if (activeIndex >= 0) chooseSuggestion(matches[activeIndex]); else addDraft(draft); }}>
          <Search size={18} aria-hidden="true" />
          <input id={`${id}-input`} ref={input} role="combobox" autoComplete="off" aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? `${id}-list` : undefined} aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined} aria-describedby={`${id}-status`} value={draft}
            onChange={e => { setDraft(e.target.value); setOpen(true); setActive(-1); setMessage(""); }}
            onFocus={() => setOpen(true)} onBlur={close}
            onKeyDown={e => {
              if (e.nativeEvent.isComposing) { if (e.key === "Enter") e.preventDefault(); return; }
              if (e.key === "Escape") { e.preventDefault(); close(); }
              else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && matches.length) {
                e.preventDefault(); setOpen(true);
                const next = activeIndex < 0 ? (e.key === "ArrowDown" ? 0 : matches.length - 1) : (activeIndex + (e.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length;
                moveActive(next);
              }
            }}
            onPaste={e => { const text = e.clipboardData.getData("text"); if (text.includes(",")) { e.preventDefault(); const field = e.currentTarget; addDraft(draft.slice(0, field.selectionStart ?? draft.length) + text + draft.slice(field.selectionEnd ?? draft.length)); } }} placeholder={inputPlaceholder} />
          {draft && <button type="button" className="icon-button" aria-label="Clear search" onClick={() => { setDraft(""); close(); input.current?.focus(); }}><X size={16} aria-hidden="true" /></button>}
          <button type="submit" className="add-button" disabled={!draft.trim()}>Add</button>
        </form>
        {expanded && <div className="autocomplete-surface">
          <div id={`${id}-list`} role="listbox" aria-multiselectable="true" aria-label="Matching skills" className="autocomplete-list">
            {matches.map((option, index) => <div key={option.value} id={`${id}-option-${index}`} role="option" aria-selected={has(option.value)} aria-disabled={atLimit && !has(option.value)} className={`autocomplete-option ${activeIndex === index ? "is-active" : ""}`} onPointerDown={e => e.preventDefault()} onMouseDown={e => e.preventDefault()} onClick={() => chooseSuggestion(option)}>
              <span><strong>{option.label}</strong><small>{option.category ?? "Other / Custom"}</small></span>{has(option.value) ? <Check size={16} aria-label="Selected" /> : <Plus size={16} aria-hidden="true" />}
            </div>)}
          </div>
          {!matches.length && <p role="status" className="search-feedback">{allowCustom ? "No matches. Press Enter to add a custom skill." : "No matching skills."}</p>}
        </div>}
      </div>
    </section>
    <section className="selected-section" aria-labelledby={`${id}-selected`}>
      <div className="section-heading"><h2 id={`${id}-selected`} className="section-title"><span className="section-icon" aria-hidden="true"><Layers size={18} /></span><span>Selected Skills</span></h2><span className="selection-count" aria-label={`${selected.length}${maxSkills !== undefined ? ` of ${maxSkills}` : ""} skills selected`}>{selected.length}{maxSkills !== undefined ? ` / ${maxSkills}` : ""}</span></div>
      {selected.length ? <div className="selected-grid">{selected.map(tag => <div className="selected-skill" key={tag}><SkillIcon skill={tag} category={categoryFor(tag)} /><div className="selected-label"><strong>{labelFor(tag)}</strong><span>{categoryFor(tag)}</span></div><button type="button" className="icon-button" onClick={() => remove(tag)} aria-label={`Remove ${labelFor(tag)}`}><X size={15} aria-hidden="true" /></button></div>)}</div> : <p className="empty-state">No skills yet. Search or choose one below.</p>}
      <p id={`${id}-status`} role="status" className="status">{message || (atLimit ? `Limit reached. Remove a skill to add another.` : "")}</p>
    </section>
    </div>
    {recommendations && <section className="suggested-section" aria-labelledby={`${id}-suggested`}><h2 id={`${id}-suggested`} className="section-title"><span className="section-icon" aria-hidden="true"><Sparkles size={18} /></span><span>Suggested Skills</span></h2><div className="skill-grid">{recommended.map(tag => pill(optionFor(tag) ?? { value: tag, label: tag }, true))}</div></section>}
    <section className="discover-section" aria-labelledby={`${id}-discover`}>
      <div className="section-heading"><h2 id={`${id}-discover`} className="section-title"><span className="section-icon" aria-hidden="true"><Compass size={18} /></span><span>Discover More Skills</span></h2><label className="sr-only" htmlFor={`${id}-category`}>Filter by category</label><select id={`${id}-category`} value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
      <div className="skill-browser" aria-label={`${category} skills`}>{groups.map(group => <div className="category-group" key={group}><h3><Monitor size={14} aria-hidden="true" /><span>{group}</span></h3><div className="skill-grid">{browsing.filter(o => (o.category ?? "Other / Custom") === group).map(option => pill(option))}</div></div>)}</div>
    </section>
  </div>;
}
