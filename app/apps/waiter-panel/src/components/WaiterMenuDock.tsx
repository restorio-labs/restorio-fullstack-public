import { Button, cn } from "@restorio/ui";
import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { IoIosCloseCircleOutline, IoIosAdd } from "react-icons/io";

export interface WaiterMenuDockItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  price: number;
  category?: string;
}

interface WaiterMenuDockProps {
  isOpen: boolean;
  placement: "right" | "bottom";
  title: string;
  emptyLabel: string;
  closeLabel: string;
  items: WaiterMenuDockItem[];
  onAddItem: (itemId: string) => void;
  onClose: () => void;
}

const UNCATEGORIZED = "Inne";

export const WaiterMenuDock = ({
  isOpen,
  placement,
  title,
  emptyLabel,
  closeLabel,
  items,
  onAddItem,
  onClose,
}: WaiterMenuDockProps): ReactElement => {
  const [motionReady, setMotionReady] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const groupedItems = useMemo(() => {
    const groups: Record<string, WaiterMenuDockItem[]> = {};

    for (const item of items) {
      const category = item.category?.trim() ?? UNCATEGORIZED;

      groups[category] = groups[category] ?? [];
      groups[category].push(item);
    }

    return groups;
  }, [items]);

  const categories = useMemo(() => Object.keys(groupedItems), [groupedItems]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMotionReady(true);
    });

    return (): void => {
      cancelAnimationFrame(id);
    };
  }, []);

  useEffect(() => {
    if (categories.length > 0 && activeCategory === null) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const scrollToCategory = (category: string): void => {
    const element = categoryRefs.current[category];

    if (element && scrollContainerRef.current) {
      const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
      const elementTop = element.getBoundingClientRect().top;
      const offset = elementTop - containerTop + scrollContainerRef.current.scrollTop - 8;

      scrollContainerRef.current.scrollTo({ top: offset, behavior: "smooth" });
      setActiveCategory(category);
    }
  };

  const handleScroll = (): void => {
    if (!scrollContainerRef.current) {
      return;
    }

    const containerTop = scrollContainerRef.current.getBoundingClientRect().top;

    let closestCategory: string | null = null;
    let closestDistance = Infinity;

    for (const category of categories) {
      const element = categoryRefs.current[category];

      if (element) {
        const elementTop = element.getBoundingClientRect().top;
        const distance = Math.abs(elementTop - containerTop);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestCategory = category;
        }
      }
    }

    if (closestCategory && closestCategory !== activeCategory) {
      setActiveCategory(closestCategory);
    }
  };

  const effectiveOpen = motionReady && isOpen;
  const isRight = placement === "right";

  return (
    <>
      <button
        type="button"
        aria-hidden={!effectiveOpen}
        tabIndex={effectiveOpen ? 0 : -1}
        className={cn(
          "fixed inset-0 z-40 bg-black/25 transition-opacity duration-300",
          effectiveOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "fixed z-50 flex min-h-0 flex-col py-1 overflow-hidden bg-surface-primary shadow-overlay transition-transform duration-300 ease-out",
          isRight
            ? "bottom-0 right-0 top-0 w-[min(100vw,20rem)] border-l border-border-default"
            : "bottom-0 left-0 right-0 max-h-[min(55vh,28rem)] rounded-t-lg border-t border-border-default",
          isRight
            ? effectiveOpen
              ? "translate-x-0"
              : "translate-x-full"
            : effectiveOpen
              ? "translate-y-0"
              : "translate-y-full",
          effectiveOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-default px-5 py-1">
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 shrink-0 text-status-error-text before:absolute before:-inset-4 md:before:inset-0"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <IoIosCloseCircleOutline className="h-7 w-7" />
          </Button>
        </div>
        {categories.length > 1 && (
          <div className="sticky top-0 z-10 flex shrink-0 gap-1 overflow-x-auto border-b border-border-default bg-surface-primary px-3 py-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  scrollToCategory(category);
                }}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  activeCategory === category
                    ? "bg-brand-primary text-white"
                    : "bg-background-secondary text-text-secondary hover:bg-background-tertiary",
                )}
              >
                {category}
              </button>
            ))}
          </div>
        )}
        <div ref={scrollContainerRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {items.length === 0 ? (
            <div className="rounded-md border border-border-default bg-background-secondary px-3 py-2 text-sm text-text-secondary">
              {emptyLabel}
            </div>
          ) : (
            <div className="flex flex-col gap-4 pb-4">
              {categories.map((category) => (
                <div
                  key={category}
                  ref={(el) => {
                    categoryRefs.current[category] = el;
                  }}
                >
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">{category}</h3>
                  <div className="flex flex-col gap-2 rounded-lg border border-border-default bg-background-secondary p-2">
                    {groupedItems[category].map((item) => (
                      <div
                        key={item.id}
                        className="rounded-md border border-border-default bg-surface-primary px-4 py-3 text-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-text-primary">{item.name}</div>
                            {item.description.trim() !== "" && (
                              <div className="mt-0.5 text-xs text-text-secondary">{item.description}</div>
                            )}
                            {item.tags.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {item.tags.map((tag) => (
                                  <span
                                    key={`${item.id}-${tag}`}
                                    className="rounded-full border border-border-default bg-background-secondary px-2 py-0.5 text-[10px] text-text-secondary"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="whitespace-nowrap text-sm font-semibold text-text-primary">
                              {item.price.toFixed(2)}
                            </span>
                            <Button
                              type="button"
                              variant="primary"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => {
                                onAddItem(item.id);
                              }}
                            >
                              <IoIosAdd className="h-6 w-6" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
