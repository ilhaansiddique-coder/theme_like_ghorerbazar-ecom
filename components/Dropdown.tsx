"use client";

/**
 * Custom dropdown — a styled, animated replacement for a native <select>.
 * Used for the shop sort filter and the contact "Subject" field. The menu
 * stays mounted and animates open/closed via a CSS class so the transition is
 * smooth both ways. Closes on outside-click or Escape.
 *
 *   block     — make the trigger + menu full-width (form fields)
 *   ariaLabel — accessible name when there is no visible <label> text
 */

import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiCheck } from "react-icons/fi";

export interface DropdownOption { value: string; label: string }

interface Props {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  block?: boolean;
  ariaLabel?: string;
}

export default function Dropdown({ value, options, onChange, block, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`tpl-select ${block ? "tpl-select--block" : ""}`} ref={ref}>
      <button
        type="button"
        className={`tpl-select__btn ${open ? "tpl-select__btn--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span>{current?.label}</span>
        <FiChevronDown size={16} className="tpl-select__chev" />
      </button>
      <ul className={`tpl-select__menu ${open ? "tpl-select__menu--open" : ""}`} role="listbox" aria-hidden={!open}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <li
              key={o.value}
              role="option"
              aria-selected={active}
              className={`tpl-select__opt ${active ? "tpl-select__opt--active" : ""}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              <span>{o.label}</span>
              {active && <FiCheck size={15} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
