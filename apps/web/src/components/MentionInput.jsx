import React, { useState, useRef, useEffect } from "react";

/**
 * MentionInput - A textarea that supports @mentions
 * 
 * @param {Object} props
 * @param {string} props.value - Current text value
 * @param {Function} props.onChange - Called with new value when text changes
 * @param {Array} props.users - Array of user objects with {id, name, email}
 * @param {Function} props.onMentionsChange - Called with array of mentioned users
 * @param {string} props.placeholder
 * @param {number} props.rows
 */
export function MentionInput({ value, onChange, users = [], onMentionsChange, placeholder, rows = 4 }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Extract current mentions from text
  useEffect(() => {
    if (!value || !onMentionsChange) return;
    
    const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionPattern.exec(value)) !== null) {
      const [, name, userId] = match;
      const user = users.find(u => u.id === userId);
      if (user) {
        mentions.push({ userId, name: user.name || user.email });
      }
    }
    
    onMentionsChange(mentions);
  }, [value, users, onMentionsChange]);

  const handleTextChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    
    // Check if user typed @
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const hasSpaceAfter = textAfterAt.includes(' ');
      
      if (!hasSpaceAfter && textAfterAt.length <= 50) {
        // Show suggestions
        setMentionStart(lastAtIndex);
        const searchTerm = textAfterAt.toLowerCase();
        const filtered = users.filter(user => 
          (user.name || user.email).toLowerCase().includes(searchTerm)
        ).slice(0, 5);
        setFilteredUsers(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMention = (user) => {
    if (mentionStart === -1) return;
    
    const textarea = textareaRef.current;
    const beforeMention = value.substring(0, mentionStart);
    const afterMention = value.substring(textarea.selectionStart);
    
    // Use markdown-style mention: @[Name](userId)
    const mentionText = `@[${user.name || user.email}](${user.id})`;
    const newValue = beforeMention + mentionText + ' ' + afterMention;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    // Set cursor after mention
    setTimeout(() => {
      const newCursorPos = beforeMention.length + mentionText.length + 1;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredUsers.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (filteredUsers[selectedIndex]) {
        insertMention(filteredUsers[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Display value with mentions highlighted
  const displayValue = value.replace(
    /@\[([^\]]+)\]\(([^)]+)\)/g,
    '@$1'
  );

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={displayValue}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-2xl border border-brand-black/20 px-4 py-2 text-sm focus:border-brand-black focus:outline-none font-mono"
      />
      
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full rounded-2xl border border-brand-black/10 bg-white shadow-lg max-h-48 overflow-y-auto"
        >
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => insertMention(user)}
              className={`w-full text-left px-4 py-2 hover:bg-brand-linen/50 transition-colors ${
                index === selectedIndex ? 'bg-brand-linen' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                {user.avatarUrl && (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name || user.email}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-black truncate">
                    {user.name || user.email}
                  </p>
                  {user.name && user.email && (
                    <p className="text-xs text-brand-black/60 truncate">{user.email}</p>
                  )}
                </div>
                {user.role && (
                  <span className="text-[0.6rem] uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-black/5 text-brand-black/60">
                    {user.role}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      
      <p className="mt-1 text-xs text-brand-black/50">
        Type <kbd className="px-1.5 py-0.5 rounded bg-brand-black/5 font-mono">@</kbd> to mention users
      </p>
    </div>
  );
}
