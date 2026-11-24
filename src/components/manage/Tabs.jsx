"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Tabs({ tabs }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 mb-8 overflow-x-auto border-b border-stone-200 px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${
                  active
                    ? "border-plum-700 text-plum-800"
                    : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-800"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
