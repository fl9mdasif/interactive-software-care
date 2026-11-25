"use client";

import Link from "next/link";
import { useState } from "react";
import { CldImg } from "@/components/ui/CldImg";
import { label } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TProduct } from "@/types";

export function ProductBrowser({ items }: { items: TProduct[] }) {
  const [active, setActive] = useState("all");
  const types = [...new Set(items.map((i) => i.type))];
  const shown = active === "all" ? items : items.filter((i) => i.type === active);

  return (
    <>
      {types.length > 1 && (
        <div className="filter-row" role="group" aria-label="Filter products by type" data-fade>
          {["all", ...types].map((t) => (
            <button key={t} type="button" className={cn("chip", t === active && "on")} aria-pressed={t === active} onClick={() => setActive(t)}>
              {label(t)}
            </button>
          ))}
        </div>
      )}
      <div className="work-grid" aria-live="polite">
        {shown.map((p, i) => (
          <Link key={p._id} href={`/products/${p.slug}`} className="work">
            <div className={cn("work-vis", `w${(i % 3) + 1}`, p.thumbnail && "has-img")}>
              {p.thumbnail && <CldImg src={p.thumbnail} alt="" w={720} h={450} sizes="(max-width: 620px) 100vw, (max-width: 940px) 50vw, 400px" />}
              <span className="tag">{label(p.type)}</span>
              <span className="tag tag-status">{label(p.status)}</span>
            </div>
            <div className="work-body">
              <h3>{p.name}</h3>
              <p>{p.tagline}</p>
              {p.techStack.length > 0 && (
                <div className="meta">
                  {p.techStack.slice(0, 4).map((t) => (
                    <i key={t}>{t}</i>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
