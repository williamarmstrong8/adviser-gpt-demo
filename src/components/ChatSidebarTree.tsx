import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { Folder, FolderOpen, MessageSquare, MoreHorizontal, ChevronRight, ChevronDown, Plus } from "lucide-react";

/**
 * Data model
 */
export type ChatNode = {
  id: string;
  type: "chat";
  title: string;
  updatedAt: string;     // ISO
  unread?: boolean;
  archived?: boolean;
};

export type FolderNode = {
  id: string;
  type: "folder";
  title: string;
  children: NodeItem[];
  expanded?: boolean;
  archived?: boolean;
  pinned?: boolean;
};

export type NodeItem = ChatNode | FolderNode;

export type ChatSidebarTreeProps = {
  items: NodeItem[];                 // Root-level nodes (folders and/or chats)
  activeChatId?: string;             // Highlighted chat
  title?: string;                    // Section title
  className?: string;

  // Node actions
  onOpenChat: (id: string) => void;
  onShare: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;

  // Folder creation helpers (optional)
  onCreateChat?: (parentFolderId?: string) => void;
  onCreateFolder?: (parentFolderId?: string) => void;
};

/**
 * Utility
 */
const pad = (lvl: number) => Math.max(0, 8 + lvl * 14); // indent per level

function formatRelative(iso: string): string {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - d);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(days / 365);
  return `${years}y`;
}

/**
 * Flatten only *visible* nodes for keyboard nav (respect expanded state)
 */
type VisibleNode = {
  node: NodeItem;
  level: number;
  path: string; // unique path (e.g., folderId/childId/…)
};
function buildVisible(nodes: NodeItem[], expanded: Record<string, boolean>, level = 0, parentPath = ""): VisibleNode[] {
  const out: VisibleNode[] = [];
  for (const n of nodes) {
    const path = parentPath ? `${parentPath}/${n.id}` : n.id;
    out.push({ node: n, level, path });
    if (n.type === "folder" && (expanded[n.id] ?? n.expanded ?? false)) {
      out.push(...buildVisible(n.children, expanded, level + 1, path));
    }
  }
  return out;
}

/**
 * Component
 */
export default function ChatSidebarTree({
  items,
  activeChatId,
  title = "Chats",
  className = "",
  onOpenChat,
  onShare,
  onRename,
  onArchive,
  onDelete,
  onCreateChat,
  onCreateFolder,
}: ChatSidebarTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Local expanded/rename/menu state
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");

  // Initialize expansion from data once
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    const seed = (nodes: NodeItem[]) => {
      nodes.forEach(n => {
        if (n.type === "folder") {
          initial[n.id] = n.expanded ?? false;
          seed(n.children);
        }
      });
    };
    seed(items);
    setExpanded(prev => Object.keys(prev).length ? prev : initial);
  }, [items]);

  const visible = useMemo(() => buildVisible(items, expanded), [items, expanded]);

  // Outside click closes menu
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (menuFor && !containerRef.current.contains(e.target as Node)) setMenuFor(null);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuFor(null);
        if (renamingId) {
          setRenamingId(null); setRenameValue("");
        }
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuFor, renamingId]);

  const toggleFolder = useCallback((id: string) => {
    setExpanded(e => ({ ...e, [id]: !e[id] }));
  }, []);

  const beginRename = (id: string, currentTitle: string) => {
    setMenuFor(null);
    setRenamingId(id);
    setRenameValue(currentTitle);
  };
  const submitRename = () => {
    if (renamingId && renameValue.trim()) onRename(renamingId, renameValue.trim());
    setRenamingId(null);
    setRenameValue("");
  };

  // Keyboard navigation (like treeview)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const focusables = Array.from(containerRef.current?.querySelectorAll<HTMLDivElement>("[role='treeitem']") ?? []);
    const idx = focusables.findIndex(el => el === document.activeElement);
    const curr = visible[idx];

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = focusables[Math.min(idx + 1, focusables.length - 1)] || focusables[0];
      next?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = focusables[Math.max(idx - 1, 0)] || focusables[focusables.length - 1];
      prev?.focus();
    } else if (e.key === "ArrowRight") {
      // Expand folder or open chat
      if (curr?.node.type === "folder") {
        if (!(expanded[curr.node.id] ?? false)) {
          e.preventDefault();
          toggleFolder(curr.node.id);
        }
      } else if (curr?.node.type === "chat") {
        e.preventDefault();
        onOpenChat(curr.node.id);
      }
    } else if (e.key === "ArrowLeft") {
      if (curr?.node.type === "folder") {
        if (expanded[curr.node.id] ?? false) {
          e.preventDefault();
          toggleFolder(curr.node.id);
        }
      }
    } else if (e.key === "Enter") {
      if (!curr) return;
      if (curr.node.type === "folder") {
        e.preventDefault();
        toggleFolder(curr.node.id);
      } else {
        e.preventDefault();
        onOpenChat(curr.node.id);
      }
    } else if ((e.shiftKey && e.key === "F10") || e.key === "ContextMenu") {
      e.preventDefault();
      const el = document.activeElement as HTMLDivElement | null;
      if (el?.dataset.id) setMenuFor(el.dataset.id);
    }
  };

  return (
    <div className={`flex flex-col min-w-0 w-full overflow-x-hidden ${className}`} ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1">
        <h3 className="text-xs font-medium text-[#71717A] uppercase tracking-wide">{title}</h3>
        <div className="flex items-center gap-1">
          {onCreateFolder && (
            <button
              className="inline-flex items-center gap-1 rounded-md border border-[#E4E4E7] px-2 py-1 text-[11px] text-[#3F3F46] hover:bg-gray-50"
              onClick={() => onCreateFolder(undefined)}
              title="New folder"
            >
              <Folder className="w-3.5 h-3.5" /> New
            </button>
          )}
          {onCreateChat && (
            <button
              className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-indigo-500"
              onClick={() => onCreateChat(undefined)}
              title="New chat"
            >
              <Plus className="w-3.5 h-3.5" /> Chat
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div
        role="tree"
        aria-label={`${title} tree`}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="flex-1 overflow-y-auto overflow-x-hidden min-w-0"
      >
        {visible.length === 0 ? (
          <div className="p-4 text-center text-sm text-[#71717A]">No items</div>
        ) : (
          <ul className="min-w-0">
            {visible.map((v, i) => (
              <TreeRow
                key={v.path}
                index={i}
                visible={visible}
                v={v}
                expanded={expanded[v.node.id] ?? (v.node.type === "folder" ? !!v.node.expanded : false)}
                isActive={v.node.type === "chat" && v.node.id === activeChatId}
                menuFor={menuFor}
                renamingId={renamingId}
                renameValue={renameValue}
                setMenuFor={setMenuFor}
                setRenameValue={setRenameValue}
                submitRename={submitRename}
                toggleFolder={toggleFolder}
                beginRename={beginRename}
                onOpenChat={onOpenChat}
                onShare={onShare}
                onArchive={onArchive}
                onDelete={onDelete}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * One visible row (folder or chat)
 */
function TreeRow({
  v, index, visible, expanded, isActive,
  menuFor, renamingId, renameValue,
  setMenuFor, setRenameValue, submitRename,
  toggleFolder, beginRename,
  onOpenChat, onShare, onArchive, onDelete
}: {
  v: VisibleNode;
  index: number;
  visible: VisibleNode[];
  expanded: boolean;
  isActive: boolean;
  menuFor: string | null;
  renamingId: string | null;
  renameValue: string;
  setMenuFor: (id: string | null) => void;
  setRenameValue: (v: string) => void;
  submitRename: () => void;
  toggleFolder: (id: string) => void;
  beginRename: (id: string, current: string) => void;
  onOpenChat: (id: string) => void;
  onShare: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isFolder = v.node.type === "folder";
  const isMenuOpen = menuFor === v.node.id;
  const isRenaming = renamingId === v.node.id;

  const onRowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) toggleFolder(v.node.id);
    else onOpenChat(v.node.id);
  };
  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuFor(v.node.id);
  };

  return (
    <li
      data-nodeid={v.node.id}
      className="relative min-w-0"
      style={{ paddingLeft: pad(v.level) }}
    >
      <div
        role="treeitem"
        aria-level={v.level + 1}
        aria-expanded={isFolder ? expanded : undefined}
        tabIndex={0}
        data-id={v.node.id}
        onClick={onRowClick}
        onContextMenu={onContextMenu}
        className={[
          "group flex items-center gap-2 px-2 py-1.5 cursor-pointer select-none w-full overflow-x-hidden",
          isActive ? "bg-indigo-50" : "hover:bg-gray-50 focus-within:bg-gray-50",
          "outline-none"
        ].join(" ")}
      >
        {/* Chevron for folders */}
        {isFolder ? (
          expanded ? (
            <ChevronDown className="w-4 h-4 text-[#71717A] shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#71717A] shrink-0" />
          )
        ) : (
          <span className="w-4 h-4 shrink-0" />
        )}

        {/* Icon */}
        {isFolder ? (
          expanded ? <FolderOpen className="w-4 h-4 text-[#3F3F46] shrink-0" /> :
                     <Folder className="w-4 h-4 text-[#3F3F46] shrink-0" />
        ) : (
          <MessageSquare className="w-4 h-4 text-[#3F3F46] shrink-0" />
        )}

        {/* Title (rename or label) */}
        <div className="min-w-0 flex-1 overflow-hidden">
          {isRenaming ? (
            <input
              className="w-full bg-transparent border-none outline-none text-[13px] text-[#3F3F46]"
              value={renameValue}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={submitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); submitRename(); }
                if (e.key === "Escape") { (e.target as HTMLInputElement).blur(); }
              }}
            />
          ) : (
            <div className="truncate text-[13px] text-[#3F3F46]">
              {v.node.title || (isFolder ? "Untitled folder" : "Untitled chat")}
            </div>
          )}
        </div>

        {/* Meta (time for chats) */}
        {v.node.type === "chat" && (
          <time
            className="text-[11px] text-[#A1A1AA] whitespace-nowrap"
            dateTime={v.node.updatedAt}
          >
            {formatRelative(v.node.updatedAt)}
          </time>
        )}

        {/* Kebab (hover only) */}
        <button
          className="
            -m-1 ml-1 inline-flex h-6 w-6 items-center justify-center rounded text-[#71717A]
            opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100
            hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500
          "
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          aria-label="Open menu"
          onClick={(e) => { e.stopPropagation(); setMenuFor(isMenuOpen ? null : v.node.id); }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {/* Context Menu */}
        {isMenuOpen && (
          <div
            role="menu"
            aria-label="Options"
            className="absolute right-2 top-7 z-50 w-44 rounded-md border border-[#E4E4E7] bg-white p-1 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <MenuBtn label="Share" onClick={() => onShare(v.node.id)} />
            <MenuBtn label="Rename" onClick={() => beginRename(v.node.id, v.node.title)} />
            {isFolder && (
              <>
                <MenuBtn label="New chat in folder" onClick={() => onCreateChat?.(v.node.id)} />
                <MenuBtn label="New folder inside" onClick={() => onCreateFolder?.(v.node.id)} />
              </>
            )}
            <MenuBtn label="Archive" onClick={() => onArchive(v.node.id)} />
            <MenuBtn label="Delete" danger onClick={() => onDelete(v.node.id)} />
          </div>
        )}
      </div>
    </li>
  );
}

function MenuBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      role="menuitem"
      className={[
        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm",
        danger ? "text-red-600 hover:bg-red-50 focus:bg-red-50" : "text-[#3F3F46] hover:bg-gray-50 focus:bg-gray-50"
      ].join(" ")}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
