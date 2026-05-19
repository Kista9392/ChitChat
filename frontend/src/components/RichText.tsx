'use client';

import React from 'react';
import Link from 'next/link';

interface RichTextProps {
  text: string;
}

export default function RichText({ text }: RichTextProps) {
  if (!text) return null;

  // Split text by hashtags and mentions, keeping them in the array
  const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('#')) {
          const tag = part.slice(1);
          return (
            <Link key={index} href={`/search?tag=${tag}`} className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
              {part}
            </Link>
          );
        }
        if (part.startsWith('@')) {
          const username = part.slice(1);
          return (
            <Link key={index} href={`/${username}`} className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
              {part}
            </Link>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
