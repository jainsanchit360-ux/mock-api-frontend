import React, { useRef, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Lightweight JSON syntax highlighter.
 * Uses a regex to classify tokens and wrap them in <span> tags
 * with CSS classes defined in index.css.
 */
function highlightJSON(code) {
  try {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped.replace(
      /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'json-num'; // default: number
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'json-key' : 'json-str';
        } else if (/true|false/.test(match)) {
          cls = 'json-bool';
        } else if (match === 'null') {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  } catch {
    return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

export default function CodeEditor({ value, onChange, isValid, error }) {
  const textareaRef = useRef(null);
  const preRef      = useRef(null);
  const lineNumRef  = useRef(null);

  // font-size 13px × line-height 1.65 = 21.45px per line
  const LINE_HEIGHT_PX = 13 * 1.65;

  const lines = (value + '\n').split('\n');

  const syncScroll = useCallback((e) => {
    const { scrollTop, scrollLeft } = e.target;
    if (preRef.current) {
      preRef.current.scrollTop  = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (lineNumRef.current) {
      lineNumRef.current.scrollTop = scrollTop;
    }
  }, []);

  /** Support Tab-key indentation inside the editor */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en } = e.target;
      const next = value.substring(0, s) + '  ' + value.substring(en);
      onChange(next);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = s + 2;
          textareaRef.current.selectionEnd   = s + 2;
        }
      });
    }
  }, [value, onChange]);

  return (
    <div
      className={`
        flex flex-col h-full rounded-2xl overflow-hidden border
        bg-zinc-950 transition-all duration-200
        ${isValid
          ? 'border-zinc-800 focus-within:border-indigo-500/40 focus-within:shadow-[0_0_0_1px_rgba(99,102,241,0.1),0_0_30px_rgba(99,102,241,0.06)]'
          : 'border-rose-500/40 shadow-[0_0_0_1px_rgba(239,68,68,0.08)]'
        }
      `}
    >
      {/* ── Editor Titlebar ── */}
      <div className="flex items-center px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800 shrink-0">
        {/* macOS-style traffic lights */}
        <div className="flex space-x-1.5 mr-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
        </div>
        <span className="flex-1 text-[11px] font-mono text-zinc-500 select-none">
          mock_payload.json
        </span>
        {/* Validation badge */}
        <span
          className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-semibold
            ${isValid
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full
              ${isValid ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}
          />
          {isValid ? 'VALID JSON' : 'INVALID'}
        </span>
      </div>

      {/* ── Editor Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Line numbers */}
        <div
          ref={lineNumRef}
          aria-hidden
          className="select-none shrink-0 text-right overflow-hidden bg-zinc-950 border-r border-zinc-800/60 text-zinc-700"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            lineHeight: '1.65',
            padding: '14px 10px 14px 8px',
            minWidth: '3.25rem',
          }}
        >
          {lines.slice(0, -1).map((_, i) => (
            <div key={i} style={{ height: `${LINE_HEIGHT_PX}px` }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* Pre + Textarea overlay */}
        <div className="relative flex-1 overflow-hidden">
          {/* Highlighted layer (behind) */}
          <pre
            ref={preRef}
            className="editor-pre"
            dangerouslySetInnerHTML={{ __html: highlightJSON(value) + '\n' }}
            aria-hidden
          />
          {/* Input layer (on top, transparent text) */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={syncScroll}
            onKeyDown={handleKeyDown}
            className="editor-textarea"
            placeholder="Paste or type your JSON here…"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      </div>

      {/* ── Error Footer ── */}
      {!isValid && error && (
        <div className="flex items-start space-x-2 px-4 py-2.5 bg-rose-950/20 border-t border-rose-900/20 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-[11px] font-mono text-rose-300 leading-snug break-all">
            <span className="font-bold text-rose-400">SyntaxError: </span>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
