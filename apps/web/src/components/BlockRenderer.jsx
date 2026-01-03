import React from "react";

/**
 * BlockRenderer - Renders CMS blocks based on block type
 * 
 * This component safely renders blocks from the CMS system.
 * Missing or invalid data results in the block being hidden (not an error).
 */
export function BlockRenderer({ blocks = [] }) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return null;
  }

  return (
    <>
      {blocks
        .filter((block) => block && block.isVisible !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((block) => {
          try {
            switch (block.blockType) {
              case "HERO":
                return <HeroBlock key={block.id} content={block.contentJson} />;
              case "TEXT":
                return <TextBlock key={block.id} content={block.contentJson} />;
              case "IMAGE":
                return <ImageBlock key={block.id} content={block.contentJson} />;
              case "SPLIT":
                return <SplitBlock key={block.id} content={block.contentJson} />;
              case "ANNOUNCEMENT":
                return <AnnouncementBlock key={block.id} content={block.contentJson} />;
              case "SPACER":
                return <SpacerBlock key={block.id} content={block.contentJson} />;
              default:
                return null; // Unknown block type - fail silently
            }
          } catch (error) {
            console.error("Error rendering block:", error, block);
            return null; // Fail silently on render errors
          }
        })}
    </>
  );
}

// ============================================
// BLOCK COMPONENTS
// ============================================

function HeroBlock({ content }) {
  if (!content || !content.headline) {
    return null; // Hide if no headline
  }

  return (
    <section className="relative w-full overflow-hidden bg-brand-linen">
      {content.image && (
        <div className="absolute inset-0">
          <img
            src={content.image}
            alt={content.headline}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      )}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 text-center">
        <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-brand-black md:text-6xl">
          {content.headline}
        </h1>
        {content.subheadline && (
          <p className="mt-6 text-lg text-brand-black/70 md:text-xl">{content.subheadline}</p>
        )}
        {content.primaryCtaText && content.primaryCtaLink && (
          <div className="mt-8">
            <a
              href={content.primaryCtaLink}
              className="inline-block rounded-full bg-brand-red px-8 py-4 text-sm font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-brand-red/90"
            >
              {content.primaryCtaText}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function TextBlock({ content }) {
  if (!content || !content.body) {
    return null; // Hide if no body
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      {content.headline && (
        <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-brand-black md:text-4xl">
          {content.headline}
        </h2>
      )}
      <div className="mt-6 prose prose-lg max-w-none">
        <p className="text-brand-black/80 leading-relaxed whitespace-pre-line">{content.body}</p>
      </div>
      {content.link && content.linkText && (
        <div className="mt-6">
          <a
            href={content.link}
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-red hover:text-brand-red/80"
          >
            {content.linkText}
            <span>→</span>
          </a>
        </div>
      )}
    </section>
  );
}

function ImageBlock({ content }) {
  if (!content || !content.image) {
    return null; // Hide if no image
  }

  const aspectRatioClasses = {
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
    "1:1": "aspect-square",
    "3:2": "aspect-[3/2]",
  };

  const aspectClass = aspectRatioClasses[content.aspectRatio] || aspectRatioClasses["16:9"];

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className={`relative w-full overflow-hidden rounded-3xl ${aspectClass}`}>
        <img
          src={content.image}
          alt={content.caption || "Image"}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>
      {content.caption && (
        <p className="mt-4 text-center text-sm text-brand-black/60">{content.caption}</p>
      )}
    </section>
  );
}

function SplitBlock({ content }) {
  if (!content || !content.image || !content.headline || !content.body) {
    return null; // Hide if missing required fields
  }

  const isImageLeft = content.imagePosition === "left";

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className={`grid gap-8 md:grid-cols-2 ${isImageLeft ? "" : "md:grid-flow-dense"}`}>
        <div className={`${isImageLeft ? "" : "md:col-start-2"}`}>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
            <img
              src={content.image}
              alt={content.headline}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        </div>
        <div className={`flex flex-col justify-center ${isImageLeft ? "" : "md:col-start-1"}`}>
          <h2 className="font-display text-3xl font-bold uppercase tracking-tight text-brand-black md:text-4xl">
            {content.headline}
          </h2>
          <p className="mt-4 text-brand-black/80 leading-relaxed whitespace-pre-line">{content.body}</p>
          {content.ctaText && content.ctaLink && (
            <div className="mt-6">
              <a
                href={content.ctaLink}
                className="inline-block rounded-full bg-brand-red px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-brand-red/90"
              >
                {content.ctaText}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AnnouncementBlock({ content }) {
  if (!content || !content.message) {
    return null; // Hide if no message
  }

  const variantClasses = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    success: "bg-green-50 border-green-200 text-green-900",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
  };

  const variantClass = variantClasses[content.variant] || variantClasses.info;

  return (
    <section className="mx-auto max-w-7xl px-6 py-4">
      <div className={`rounded-2xl border px-6 py-4 ${variantClass}`}>
        <div className="flex items-center justify-between gap-4">
          <p className="flex-1 text-sm font-medium">{content.message}</p>
          {content.ctaText && content.ctaLink && (
            <a
              href={content.ctaLink}
              className="shrink-0 rounded-full border border-current px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition hover:bg-current/10"
            >
              {content.ctaText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function SpacerBlock({ content }) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-16",
    lg: "h-32",
  };

  const sizeClass = sizeClasses[content?.size] || sizeClasses.md;

  return <div className={sizeClass} />;
}

