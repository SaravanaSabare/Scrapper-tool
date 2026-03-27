import { useRef, useState } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchInput({ value, onChange, placeholder = 'Search…' }: SearchInputProps) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <label className="relative flex items-center">
      <span className="sr-only">Search</span>
      <span
        className="pointer-events-none absolute left-3 font-mono-accent text-xs text-(--text-faint)"
        aria-hidden="true"
      >
        ⌕
      </span>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`font-mono-accent w-full min-w-56 rounded-md border bg-(--surface-elevated) py-2 pl-8 pr-16 text-xs text-(--text-primary) placeholder:text-(--text-faint) focus:outline-none transition-[border-color,box-shadow] duration-150 ${
          focused
            ? 'border-(--accent) shadow-[0_0_0_3px_var(--accent-glow)]'
            : 'border-(--border)'
        }`}
      />
      <kbd className="pointer-events-none absolute right-3 hidden rounded border border-(--border) bg-(--surface) px-1.5 py-0.5 font-mono-accent text-[10px] text-(--text-faint) sm:flex">
        ⌘K
      </kbd>
    </label>
  )
}
