'use client';

import { useState } from 'react';
import { getInitials } from '@/lib/stream-utils';

interface StreamerAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md';
  muted?: boolean;
}

const RING_ACCENTS = [
  'from-[#FF2E93] via-[#FF8A3D] to-[#7B2FF7]',
  'from-[#00E5C7] via-[#7B2FF7] to-[#FF2E93]',
  'from-[#FFD23F] via-[#FF8A3D] to-[#FF2E93]',
];

function pickAccentIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % RING_ACCENTS.length;
  }
  return Math.abs(hash);
}

export default function StreamerAvatar({
  name,
  avatarUrl,
  size = 'md',
  muted = false,
}: StreamerAvatarProps) {
  const [failed, setFailed] = useState(false);
  const dimClass = size === 'sm' ? 'w-9 h-9 text-xs' : 'w-10 h-10 text-sm';
  const imgSize = size === 'sm' ? 36 : 40;
  const gradient = RING_ACCENTS[pickAccentIndex(name)];
  const showImage = Boolean(avatarUrl && !failed);

  return (
    <div
      className={`relative shrink-0 rounded-full p-[1.5px] ${
        muted ? 'bg-[#B7A9CC]/25' : `bg-gradient-to-br ${gradient}`
      }`}
    >
      <div
        className={`${dimClass} rounded-full overflow-hidden bg-[#170B2A] flex items-center justify-center font-display font-bold tracking-tight ${
          muted ? 'text-[#B7A9CC]' : 'text-[#FFF5FA]'
        }`}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`${name} avatar`}
            width={imgSize}
            height={imgSize}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{getInitials(name)}</span>
        )}
      </div>
    </div>
  );
}
