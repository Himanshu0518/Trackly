import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Send, AtSign } from "lucide-react";
import type { MemberData } from "@/types/user.types";
import { cn } from "@/lib/utils";

interface MentionCommentInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  members: MemberData[];
  placeholder?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function MentionCommentInput({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  members,
  placeholder = "Write a comment... (Type @ to mention a teammate)",
}: MentionCommentInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter members based on mentionQuery
  const filteredMembers = mentionQuery === null
    ? []
    : members.filter((m) => {
        const q = mentionQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
        );
      }).slice(0, 5);

  const showDropdown = mentionQuery !== null && filteredMembers.length > 0;

  // Track text changes and determine if an @mention is active
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChange(text);

    const cursorPos = e.target.selectionStart ?? text.length;
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      // Check that the character before '@' is whitespace or start of line
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);

      // Only treat as mention if there's no newline and character before '@' is whitespace
      if (/\s/.test(charBeforeAt) && !/\s/.test(textAfterAt) && textAfterAt.length <= 20) {
        setMentionStartIndex(lastAtIndex);
        setMentionQuery(textAfterAt);
        setSelectedIndex(0);
        return;
      }
    }

    setMentionQuery(null);
    setMentionStartIndex(-1);
  };

  const insertMention = useCallback(
    (member: MemberData) => {
      if (mentionStartIndex === -1 || !textareaRef.current) return;

      const before = value.slice(0, mentionStartIndex);
      const afterCursor = value.slice(textareaRef.current.selectionStart || value.length);
      const mentionTag = `@${member.name} `;
      const newValue = `${before}${mentionTag}${afterCursor}`;

      onChange(newValue);
      setMentionQuery(null);
      setMentionStartIndex(-1);

      // Restore cursor position after the mention tag
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = before.length + mentionTag.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 10);
    },
    [mentionStartIndex, value, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isSubmitting && value.trim()) {
        onSubmit();
      }
      return;
    }

    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredMembers.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const selected = filteredMembers[selectedIndex];
      if (selected) {
        insertMention(selected);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setMentionQuery(null);
      setMentionStartIndex(-1);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setMentionQuery(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative space-y-2">
      {/* Autocomplete Dropdown Popup */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute left-0 bottom-full mb-1 z-30 w-64 rounded-lg border border-border bg-popover shadow-xl shadow-black/10 overflow-hidden animate-in fade-in-0 zoom-in-95"
        >
          <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground bg-muted/30 border-b border-border/50 flex items-center gap-1">
            <AtSign className="h-3 w-3 text-primary" />
            <span>Mention teammate</span>
          </div>
          <div className="py-1 max-h-48 overflow-y-auto">
            {filteredMembers.map((member, idx) => (
              <button
                key={member._id}
                type="button"
                onClick={() => insertMention(member)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs transition-colors",
                  idx === selectedIndex
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarFallback className="text-[9px] bg-muted">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{member.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {member.email}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input container */}
      <div className="rounded-lg border border-border bg-card p-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none leading-relaxed"
        />

        <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="hidden sm:inline">Press</span>
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted/50 text-[10px] font-mono">
              Ctrl+Enter
            </kbd>
            <span className="hidden sm:inline">to send</span>
          </div>

          <Button
            size="sm"
            onClick={onSubmit}
            disabled={isSubmitting || !value.trim()}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <span>Comment</span>
                <Send className="h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Mention Chips */}
      {members.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <AtSign className="h-3 w-3 text-muted-foreground/60" /> Quick mention:
          </span>
          {members.slice(0, 4).map((m) => (
            <button
              key={m._id}
              type="button"
              onClick={() => {
                const space = value.length > 0 && !value.endsWith(" ") ? " " : "";
                onChange(`${value}${space}@${m.name} `);
                textareaRef.current?.focus();
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border/60 transition-colors"
            >
              <span className="font-medium">@{m.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
