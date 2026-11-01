import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Volume2 } from 'lucide-react';
import { useLanguage } from '../i18n';

const SENTENCE_PAUSE = 5;
const COMMA_PAUSE = 2;
const DIGIT_WEIGHT = 3;

// Roughly how long a word takes to say: digits are read out slowly, and punctuation adds a pause.
const wordWeight = (word) => {
  const digits = (word.match(/\d/g) || []).length;
  const pause = /[।.!?]["”)]?$/.test(word) ? SENTENCE_PAUSE : /[,;:]$/.test(word) ? COMMA_PAUSE : 0;
  return word.length + digits * (DIGIT_WEIGHT - 1) + pause;
};

const splitWords = (text) => {
  const words = [];
  let total = 0;
  for (const match of text.matchAll(/\S+/g)) {
    const weight = wordWeight(match[0]);
    words.push({ text: match[0], charStart: match.index, weightStart: total });
    total += weight;
  }
  return { words, total };
};

const wordAt = (words, position, total) => {
  const target = position.charIndex ?? position.fraction * total;
  const key = position.charIndex !== undefined ? 'charStart' : 'weightStart';
  let found = 0;
  for (let index = 0; index < words.length && words[index][key] <= target; index += 1) found = index;
  return found;
};

function FollowText({ speaker, text, speaking }) {
  const { t } = useLanguage();
  const { words, total } = useMemo(() => splitWords(text), [text]);
  const [active, setActive] = useState(0);
  const panelRef = useRef(null);

  // Only this panel updates, and only when the word changes, so the rest of the page stays still.
  useEffect(() => {
    if (!speaking) return undefined;
    setActive(0);
    let frame;
    const follow = () => {
      const position = speaker.getPosition();
      if (position) setActive((current) => Math.max(current, wordAt(words, position, total)));
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
    // getPosition reads refs, so it is the same for the whole of this reading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speaking, words, total]);

  // An auto-played answer may be below the fold.
  useEffect(() => {
    if (!speaking) return;
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    panelRef.current?.scrollIntoView({ block: 'nearest', behavior: calm ? 'auto' : 'smooth' });
  }, [speaking]);

  const Icon = speaking ? Volume2 : CheckCircle2;
  return (
    <div ref={panelRef} data-speech-follow className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 scroll-mt-28">
      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-2">
        <Icon className="w-4 h-4" aria-hidden="true" />
        <span>{speaking ? t.nowReading : t.spokenText}</span>
      </div>
      {/* The same answer is on the card, so screen readers skip this copy. */}
      <p aria-hidden="true" className="text-base sm:text-lg font-semibold leading-relaxed">
        {words.map((word, index) => {
          const current = speaking && index === active;
          const upcoming = speaking && index > active;
          return (
            <React.Fragment key={word.charStart}>
              <span
                data-active={current || undefined}
                className={`rounded px-0.5 transition-colors duration-150 ${
                  current ? 'bg-amber-300 text-stone-950' : upcoming ? 'text-stone-500' : 'text-stone-900'
                }`}
              >
                {word.text}
              </span>{' '}
            </React.Fragment>
          );
        })}
      </p>
    </div>
  );
}

// Appears the first time this text is read aloud, and then stays so it can be read at leisure.
export default function SpeechFollow({ speaker, text, id }) {
  const speaking = speaker.speakingId === id;
  const [readText, setReadText] = useState(null);

  useEffect(() => {
    if (speaking) setReadText(text);
  }, [speaking, text]);

  // After a language change the answer is new text that hasn't been read yet.
  if (!speaking && readText !== text) return null;
  return <FollowText key={`${id}:${text}`} speaker={speaker} text={text} speaking={speaking} />;
}
