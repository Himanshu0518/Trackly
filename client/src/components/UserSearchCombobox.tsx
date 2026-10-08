import { useState, useRef, useEffect } from "react";
import { Search, Loader2, UserX, Check } from "lucide-react";
import { useSearchUsersQuery } from "@/services/auth.services";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import type { UserSearchResult } from "@/types/user.types";

interface UserSearchComboboxProps {
  /** Called when the user picks someone from the list */
  onSelect: (user: UserSearchResult) => void;
  /** Currently selected user (to show the checkmark) */
  selected: UserSearchResult | null;
  /** Disable the whole control */
  disabled?: boolean;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function UserSearchCombobox({
  onSelect,
  selected,
  disabled = false,
}: UserSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 350);

  // Only fire the search when we have ≥ 2 chars (matches server-side guard)
  const shouldSearch = debouncedQuery.trim().length >= 2;

  const { data, isFetching } = useSearchUsersQuery(debouncedQuery.trim(), {
    skip: !shouldSearch,
  });

  const results = data?.data ?? [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (user: UserSearchResult) => {
    onSelect(user);
    setQuery(user.name);   // show the name in the input after selection
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
    // If user clears the input, clear the selection too
    if (!e.target.value) onSelect({ _id: "", name: "", email: "" });
  };

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder="Search by name or email…"
          disabled={disabled}
          className={cn(
            "w-full pl-9 pr-4 py-2 text-sm rounded-md border border-input bg-background",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors"
          )}
          autoComplete="off"
          spellCheck={false}
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className={cn(
          "absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md",
          "overflow-hidden"
        )}>
          {isFetching ? (
            <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
              <UserX className="h-3.5 w-3.5" />
              No users found without a team
            </div>
          ) : (
            <ul className="py-1 max-h-52 overflow-y-auto">
              {results.map((u) => {
                const isSelected = selected?._id === u._id;
                return (
                  <li key={u._id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()} // prevent input blur
                      onClick={() => handleSelect(u)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left",
                        "hover:bg-accent transition-colors",
                        isSelected && "bg-accent"
                      )}
                    >
                      {/* Avatar */}
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-semibold text-primary">
                          {getInitials(u.name)}
                        </span>
                      </div>

                      {/* Name + email */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>

                      {/* Checkmark if already selected */}
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Hint text */}
      {query.trim().length > 0 && query.trim().length < 2 && (
        <p className="mt-1 text-xs text-muted-foreground">Type at least 2 characters to search</p>
      )}
    </div>
  );
}
