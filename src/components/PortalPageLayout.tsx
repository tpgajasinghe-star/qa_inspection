import React from 'react';

/**
 * PortalPageLayout — Standard Full-Screen Centered Portal Layout Wrapper
 *
 * ARCHITECTURE STANDARD FOR ALL CARD / PORTAL SELECTION PAGES:
 * The application shell in `src/App.tsx` renders:
 *   1. Outer shell: `min-h-screen flex flex-col`
 *   2. Top bar: `<PortalHeader />` (`shrink-0`)
 *   3. Main slot: `<main className="flex-1 w-full flex flex-col items-center relative z-10">`
 *   4. Bottom bar: `<footer>` (`shrink-0`)
 *
 * Inside `<main>`, every card-based / portal selection page MUST wrap its header/title block
 * and card grid inside `<PortalPageLayout>` so that BOTH the title block AND the cards stay
 * grouped together with a consistent fixed gap (`gap-8` by default) and remain cleanly centered
 * vertically on all displays (1366x768, 1920x1080 16:9, 1920x1200 16:10, and ultra-wide).
 *
 * IMPORTANT RULES FOR FUTURE PAGES:
 * - Do NOT use `justify-between`, `mt-auto`, or `my-auto` between the page title and cards.
 * - Pass the page title block via the `header` prop (or place it directly with the grid inside `children`)
 *   and let `PortalPageLayout` control vertical centering and spacing uniformly.
 * - If a page also has a slim top breadcrumb/context bar, pass it via `topBar` so it sits cleanly
 *   at the top while the title + cards remain vertically centered in the remaining space.
 */
interface PortalPageLayoutProps {
  /** Optional top breadcrumb or status bar pinned cleanly above the centered content */
  topBar?: React.ReactNode;
  /** Optional page title / hero header block grouped directly above the card grid */
  header?: React.ReactNode;
  /** Primary page content (typically the card grid) */
  children: React.ReactNode;
  /** Max container width (Tailwind class, e.g., 'max-w-6xl', 'max-w-7xl') */
  maxWidthClass?: string;
  /** Fixed vertical gap between the header block and card grid (default: 'gap-8') */
  gapClass?: string;
  /** Additional classes for the outer wrapper */
  className?: string;
}

export const PortalPageLayout: React.FC<PortalPageLayoutProps> = ({
  topBar,
  header,
  children,
  maxWidthClass = 'max-w-7xl',
  gapClass = 'gap-8',
  className = '',
}) => {
  if (topBar) {
    return (
      <div
        className={`w-full flex-1 flex flex-col items-center px-6 py-8 z-10 ${maxWidthClass} mx-auto ${className}`}
      >
        <div className="w-full shrink-0 mb-6">{topBar}</div>
        <div className={`w-full flex-1 flex flex-col items-center justify-center ${gapClass}`}>
          {header}
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full flex-1 flex flex-col items-center justify-center px-6 py-8 z-10 ${maxWidthClass} mx-auto ${gapClass} ${className}`}
    >
      {header}
      {children}
    </div>
  );
};
