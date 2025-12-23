import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../services/apiClient.js";

/**
 * Top Performing Posts Component
 * 
 * Displays top 3-5 performing posts from connected social accounts
 * Platforms: Instagram, TikTok, YouTube
 * Sorted by: Engagement rate (primary), Views (secondary)
 * 
 * Design: Calm, motivational, read-only for talent
 */

const PLATFORM_ICONS = {
  instagram: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  tiktok: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  ),
  youtube: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
};

function PostCard({ post }) {
  const platformIcon = PLATFORM_ICONS[post.platform?.toLowerCase()] || null;
  
  return (
    <article className="rounded-2xl border border-brand-black/10 bg-brand-linen/40 p-4 hover:bg-brand-linen/60 transition-colors">
      <div className="flex items-start gap-3">
        {/* Platform icon */}
        <div className="flex-shrink-0 mt-1 text-brand-black/70">
          {platformIcon}
        </div>
        
        {/* Post content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {/* Caption excerpt */}
              <p className="text-sm text-brand-black line-clamp-2">
                {post.caption || "No caption"}
              </p>
              
              {/* Platform label */}
              <p className="mt-1 text-xs uppercase tracking-[0.3em] text-brand-black/60">
                {post.platform}
              </p>
            </div>
            
            {/* Thumbnail (if available) */}
            {post.thumbnail && (
              <div className="flex-shrink-0">
                <img 
                  src={post.thumbnail} 
                  alt="Post thumbnail"
                  className="h-16 w-16 rounded-lg object-cover border border-brand-black/10"
                />
              </div>
            )}
          </div>
          
          {/* Key metric */}
          <div className="mt-3 flex items-center gap-3 text-xs">
            {post.engagementRate && (
              <div className="flex items-center gap-1">
                <span className="font-semibold text-brand-red">{post.engagementRate}%</span>
                <span className="text-brand-black/60">engagement</span>
              </div>
            )}
            {post.views && (
              <div className="flex items-center gap-1">
                <span className="font-semibold text-brand-black">{post.views.toLocaleString()}</span>
                <span className="text-brand-black/60">views</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function TopPerformingPosts({ session }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSocials, setHasSocials] = useState(false);

  useEffect(() => {
    const fetchTopPosts = async () => {
      try {
        const response = await apiFetch("/api/analytics/top-posts?limit=5");
        
        if (response.status === 404 || response.status === 403) {
          // Endpoint not implemented or no access - assume no socials connected
          setHasSocials(false);
          setPosts([]);
          setLoading(false);
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.posts && data.posts.length > 0) {
            setHasSocials(true);
            setPosts(data.posts);
          } else {
            setHasSocials(data.hasSocials || false);
            setPosts([]);
          }
        } else {
          // Error - show empty state
          setHasSocials(false);
          setPosts([]);
        }
      } catch (error) {
        console.warn("[TopPerformingPosts] Failed to load:", error);
        setHasSocials(false);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopPosts();
  }, [session]);

  // Loading state
  if (loading) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
          Top performing content
        </p>
        <p className="mt-4 text-sm text-brand-black/60">Loading your best posts...</p>
      </section>
    );
  }

  // Empty state - No socials connected
  if (!hasSocials) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
          Top performing content
        </p>
        <h3 className="mt-2 font-display text-2xl uppercase text-brand-black">
          Connect your socials to see what's working
        </h3>
        <p className="mt-3 text-sm text-brand-black/70">
          Once your Instagram, TikTok or YouTube is connected, we'll surface your best-performing content here.
        </p>
        <Link
          to="/exclusive/socials"
          className="mt-4 inline-flex rounded-full bg-brand-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white hover:bg-brand-black/90 transition-colors"
        >
          Add social accounts
        </Link>
      </section>
    );
  }

  // No posts yet (but socials are connected)
  if (posts.length === 0) {
    return (
      <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
        <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
          Top performing content
        </p>
        <p className="mt-4 text-sm text-brand-black/70">
          Your connected accounts don't have enough data yet. Keep creating — we'll highlight your best work here soon.
        </p>
      </section>
    );
  }

  // Show top posts
  return (
    <section className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">
            Top performing content
          </p>
          <h3 className="mt-1 font-display text-2xl uppercase text-brand-black">
            What's resonating
          </h3>
        </div>
        <Link
          to="/exclusive/socials"
          className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5 transition-colors"
        >
          View all
        </Link>
      </div>
      
      <div className="mt-4 space-y-3">
        {posts.map((post, idx) => (
          <PostCard key={post.id || idx} post={post} />
        ))}
      </div>
    </section>
  );
}
