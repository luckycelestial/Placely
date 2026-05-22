"use client";

import React, { useState, useRef, useEffect } from 'react';
import { LuChevronDown, LuSearch, LuCheck } from 'react-icons/lu';
import { cn } from '@/lib/utils';

export interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-lg border border-border-subtle bg-background px-3 py-2 text-xs font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/50 transition-colors truncate"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <LuChevronDown size={14} className={cn("text-muted transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full z-[100] bg-background rounded-xl border border-border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[300px]">
          <div className="p-2 border-b border-border-subtle flex items-center gap-2 bg-surface/50">
            <LuSearch size={14} className="text-muted ml-1" />
            <input
              type="text"
              autoFocus
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none text-xs focus:outline-none placeholder:text-muted/70 text-foreground"
            />
          </div>
          
          <div className="overflow-y-auto no-scrollbar flex-1 p-1 bg-background">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2 py-2 text-left text-xs font-medium rounded-lg hover:bg-black/5 transition-colors",
                    value === option.value && "bg-primary/10 text-primary font-bold hover:bg-primary/15"
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.value && <LuCheck size={14} className="shrink-0 ml-2" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
