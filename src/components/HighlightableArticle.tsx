
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

type HighlightColor = 'yellow' | 'green';

interface Highlight {
  id: string;
  text: string;
  color?: HighlightColor;
  range: {
    startPath: number[];
    startOffset: number;
    endPath: number[];
    endOffset: number;
  };
  createdAt: number;
}

interface Props {
  slug: string;
  children: React.ReactNode;
}

export default function HighlightableArticle({ slug, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [pendingRange, setPendingRange] = useState<Range | null>(null);

  // --- Helper Functions for DOM Traversal ---

  const getPathToNode = (root: Node, node: Node): number[] => {
    const path: number[] = [];
    let current = node;
    while (current !== root) {
      const parent = current.parentNode;
      if (!parent) break;
      const index = Array.from(parent.childNodes).indexOf(current as ChildNode);
      path.unshift(index);
      current = parent;
    }
    return path;
  };

  const getNodeFromPath = (root: Node, path: number[]): Node | null => {
    let current = root;
    for (const index of path) {
      if (!current.childNodes[index]) return null;
      current = current.childNodes[index];
    }
    return current;
  };

  // --- Core Logic ---

  const serializeRange = (range: Range): Highlight['range'] | null => {
    if (!containerRef.current) return null;
    const root = containerRef.current;
    
    // Ensure range is inside our container
    if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
        return null;
    }

    return {
      startPath: getPathToNode(root, range.startContainer),
      startOffset: range.startOffset,
      endPath: getPathToNode(root, range.endContainer),
      endOffset: range.endOffset,
    };
  };

  // Apply visual highlight to a range
  const highlightRange = (range: Range, id: string, color: HighlightColor = 'yellow') => {
    try {
        // Create the highlight span
        const span = document.createElement('span');
        const colorClass = color === 'green' 
            ? 'bg-green-100/80 hover:bg-green-200' 
            : 'bg-yellow-100/80 hover:bg-yellow-200';
            
        span.className = `${colorClass} decoration-clone py-0.5 rounded cursor-pointer transition-colors`;
        span.dataset.highlightId = id;
        span.dataset.highlightColor = color;
        
        range.surroundContents(span);
        
        // Remove selection
        window.getSelection()?.removeAllRanges();
        return true;
    } catch (e) {
        console.warn("Could not highlight range (likely crosses block boundaries):", e);
        return false;
    }
  };

  // Restore a highlight from data
  const restoreHighlight = useCallback((h: Highlight) => {
    if (!containerRef.current) return;
    const root = containerRef.current;

    const startNode = getNodeFromPath(root, h.range.startPath);
    const endNode = getNodeFromPath(root, h.range.endPath);

    if (startNode && endNode) {
      const range = document.createRange();
      try {
        range.setStart(startNode, h.range.startOffset);
        range.setEnd(endNode, h.range.endOffset);
        
        // Check if already highlighted (simple check)
        const parent = startNode.parentElement;
        if (parent && parent.dataset.highlightId === h.id) return;
        
        const color = h.color || 'yellow'; // Default to yellow for existing ones
        highlightRange(range, h.id, color);
      } catch (e) {
        console.warn("Failed to restore range:", e);
      }
    }
  }, []);

  // --- Effects ---

  // 1. Fetch highlights on mount
  useEffect(() => {
    fetch(`/api/interactions?slug=${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.highlights) {
          setHighlights(data.highlights);
          data.highlights.forEach((h: Highlight) => restoreHighlight(h));
        }
      })
      .catch(err => console.error("Failed to load highlights", err));
  }, [slug, restoreHighlight]);

  // 2. Handle Text Selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      
      if (!selection || selection.isCollapsed) {
        setSelectionRect(null);
        setPendingRange(null);
        return;
      }

      const range = selection.getRangeAt(0);
      
      if (containerRef.current && !containerRef.current.contains(range.commonAncestorContainer)) {
          return;
      }

      const rect = range.getBoundingClientRect();
      setSelectionRect(rect);
      setPendingRange(range);
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);


  // --- Actions ---

  const createHighlight = async (color: HighlightColor) => {
    if (!pendingRange) return;

    const serializedRange = serializeRange(pendingRange);
    if (!serializedRange) {
        alert("Selection invalid or outside article.");
        setSelectionRect(null);
        return;
    }

    const text = pendingRange.toString();
    const id = crypto.randomUUID();

    const newHighlight: Highlight = {
      id,
      text,
      color,
      range: serializedRange,
      createdAt: Date.now()
    };

    const success = highlightRange(pendingRange, id, color);
    if (!success) {
        alert("Cannot highlight across multiple paragraphs (block-level elements). Please select text within a paragraph.");
        setSelectionRect(null);
        setPendingRange(null);
        return;
    }

    setSelectionRect(null);
    setPendingRange(null);

    // Save
    try {
        await fetch('/api/interactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, highlight: newHighlight })
        });
        setHighlights(prev => [...prev, newHighlight]);
    } catch (e) {
        console.error("Failed to save highlight:", e);
    }
  };

  return (
    <div className="relative">
      <div ref={containerRef}>
        {children}
      </div>

      {/* Floating Action Menu */}
      {selectionRect && (
        <div 
            className="fixed z-50 animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: `${selectionRect.top - 60}px`,
                left: `${selectionRect.left + (selectionRect.width / 2)}px`,
                transform: 'translateX(-50%)'
            }}
        >
            <div className="bg-gray-900 text-white rounded-full shadow-lg p-1.5 flex items-center gap-1.5">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        createHighlight('yellow');
                    }}
                    className="w-8 h-8 rounded-full bg-yellow-400 hover:bg-yellow-300 ring-2 ring-transparent hover:ring-white transition-all transform active:scale-95"
                    aria-label="Highlight Yellow"
                />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        createHighlight('green');
                    }}
                    className="w-8 h-8 rounded-full bg-green-400 hover:bg-green-300 ring-2 ring-transparent hover:ring-white transition-all transform active:scale-95"
                    aria-label="Highlight Green"
                />
            </div>
            {/* Simple arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
