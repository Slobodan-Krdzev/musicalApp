'use client';

import Image from 'next/image';
import { useState } from 'react';
import { CursorGlow } from '@/components/about/CursorGlow';
import { cn } from '@/lib/cn';

type TeamMember = {
  name: string;
  role: string;
  title: string;
  bio: string;
  responsibilities: string[];
  imageSrc: string;
  glow: 'violet' | 'indigo' | 'fuchsia' | 'sky' | 'blue' | 'purple' | 'pink';
  revealDelay: number;
};

const TEAM: TeamMember[] = [
  {
    name: 'Dragan Saplamaev',
    role: 'CEO',
    title: 'Co-Founder & Chief Executive Officer',
    bio: 'Dragan leads GigConnection\'s vision, business strategy, and growth. He focuses on partnerships, marketing, and connecting the platform with musicians and venues who need it most.',
    responsibilities: [
      'Business strategy and planning',
      'Financial management and partnerships',
      'Marketing and brand development',
      'Growth and stakeholder relations',
    ],
    imageSrc: '/gago.JPG',
    glow: 'violet',
    revealDelay: 1040,
  },
  {
    name: 'Slobodan Krzhev',
    role: 'CTO',
    title: 'Co-Founder & Chief Technology Officer',
    bio: 'Slobodan designed and built GigConnection from the ground up. He oversees product architecture, development, infrastructure, and everything that keeps the platform fast, secure, and reliable.',
    responsibilities: [
      'Product architecture and development',
      'Software engineering and IT operations',
      'Infrastructure and system reliability',
      'Technical innovation and roadmap',
    ],
    imageSrc: '/team/slobodan-krzhev.jpg',
    glow: 'indigo',
    revealDelay: 1120,
  },
];

function reveal(delayMs: number, className?: string) {
  return cn(
    'animate-in fade-in slide-in-from-bottom-4 duration-700',
    className,
    `[animation-delay:${delayMs}ms]`
  );
}

function TeamAvatar({ name, imageSrc }: { name: string; imageSrc: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (failed) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/40 to-indigo-600/30 text-xl font-bold text-violet-100 ring-2 ring-violet-500/30 sm:h-24 sm:w-24">
        {initials}
      </div>
    );
  }

  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-violet-500/25 sm:h-24 sm:w-24">
      <Image
        src={imageSrc}
        alt={name}
        fill
        className="object-cover"
        sizes="112px"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <CursorGlow
      revealClassName={reveal(member.revealDelay)}
      glow={member.glow}
      className="rounded-2xl border-zinc-800/80 bg-black/40 p-6 sm:p-8"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4 sm:gap-5">
          <TeamAvatar name={member.name} imageSrc={member.imageSrc} />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">{member.role}</p>
            <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">{member.name}</h3>
            <p className="mt-1 text-sm leading-snug text-zinc-400">{member.title}</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">{member.bio}</p>

        <ul className="space-y-2 border-t border-zinc-800/80 pt-4">
          {member.responsibilities.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-400">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </CursorGlow>
  );
}

export function TeamSection() {
  return (
    <section className={reveal(960, 'mt-10')}>
      <div className="text-center sm:text-left">
        <p className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
          Our team
        </p>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Built by two founders, driven by one vision
        </h2>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
          <p>
            GigConnection is a small, enthusiastic team — just two people who happen to be{' '}
            <strong className="font-medium text-zinc-100">musicians and tech builders</strong>. We know the grind of
            cold-calling venues, chasing replies, and playing the same local circuit week after week.
          </p>
          <p>
            The idea started on stage: we kept running into each other at the{' '}
            <strong className="font-medium text-zinc-100">same five venues</strong>, playing to the same rooms, wondering
            why finding the right gig still felt like luck instead of a system. We built GigConnection so bands and venues
            could find each other faster — with clarity, fairness, and less hassle.
          </p>
          <p>
            One of us leads strategy, finance, marketing, and growth — turning that lived experience into a product venues
            and musicians actually want to use. The other designs and builds the platform — from architecture and code to
            infrastructure and day-to-day reliability. Together we combine business vision and technical excellence to
            create something that makes a real impact on the live music scene.
          </p>
        </div>
      </div>

      <h3 className={reveal(1000, 'mt-10 text-lg font-semibold text-white sm:text-xl')}>Meet the founders</h3>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {TEAM.map((member) => (
          <TeamMemberCard key={member.name} member={member} />
        ))}
      </div>
    </section>
  );
}
