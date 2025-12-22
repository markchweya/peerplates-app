"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";

type Props = {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
};

export default function SelectField({
  label,
  required,
  value,
  onChange,
  options,
  placeholder = "Select…",
}: Props) {
  const display = value || placeholder;

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const optionsRef = useRef<HTMLUListElement | null>(null);

  const [openUp, setOpenUp] = useState(false);

  // Rough expected height (helps us decide direction before the menu is fully measured)
  const estimatedMenuHeight = useMemo(() => {
    const row = 52; // px
    const max = 280; // px
    return Math.min(options.length * row + 12, max);
  }, [options.length]);

  const decideDirection = () => {
    const btn = btnRef.current;
    if (!btn) return;

    const r = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;

    // If not enough space below but enough space above → open upwards
    if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
      setOpenUp(true);
    } else {
      setOpenUp(false);
    }
  };

  // When opening, decide drop direction and ensure the menu is scrollable on touch devices
  useEffect(() => {
    const onResize = () => decideDirection();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimatedMenuHeight]);

  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => {
        // When it opens, compute whether to drop up or down
        useEffect(() => {
          if (open) {
            decideDirection();
            // Let the menu render first, then nudge into view if needed
            requestAnimationFrame(() => {
              optionsRef.current?.scrollIntoView({ block: "nearest" });
            });
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [open]);

        return (
          <div className="grid gap-2">
            <label className="text-sm font-semibold">
              {label} {required ? "*" : ""}
            </label>

            <div className="relative">
              <Listbox.Button
                ref={btnRef}
                className={[
                  "h-12 w-full rounded-2xl border bg-white px-4 text-left font-semibold",
                  "transition outline-none",
                  value ? "text-slate-900" : "text-slate-500",
                  "border-[#fcb040] focus:ring-4 focus:ring-[rgba(252,176,64,0.30)]",
                ].join(" ")}
              >
                <span className="block truncate">{display}</span>

                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="#fcb040"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Listbox.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-120"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Listbox.Options
                  ref={optionsRef}
                  className={[
                    "absolute z-50 w-full overflow-auto rounded-2xl border border-[#fcb040] bg-white p-1 shadow-lg focus:outline-none",
                    // Keep it scrollable + usable on small screens
                    "max-h-[min(50vh,18rem)] overscroll-contain",
                    // iOS smooth scrolling
                    "[webkit-overflow-scrolling:touch]",
                    // Positioning: drop down OR drop up
                    openUp ? "bottom-full mb-2" : "top-full mt-2",
                  ].join(" ")}
                >
                  {options.map((opt) => (
                    <Listbox.Option
                      key={opt}
                      value={opt}
                      className={({ active }) =>
                        [
                          "cursor-pointer select-none rounded-xl px-4 py-3 font-semibold",
                          active
                            ? "bg-[#fcb040] text-slate-900"
                            : "bg-white text-slate-900",
                        ].join(" ")
                      }
                    >
                      {({ selected }) => (
                        <div className="flex items-center justify-between">
                          <span className="truncate">{opt}</span>
                          {selected ? (
                            <span className="ml-3 inline-flex h-2.5 w-2.5 rounded-full bg-[#fcb040]" />
                          ) : null}
                        </div>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </div>
        );
      }}
    </Listbox>
  );
}
