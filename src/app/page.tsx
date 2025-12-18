
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { siteConfig } from '../../site-config';
import { format } from 'date-fns';

export default function Home() {
  const posts = getAllPosts();

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <header className="mb-16 pt-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-4 font-sans leading-tight">
          {siteConfig.niche}
        </h1>
        <p className="text-xl text-gray-500 font-serif leading-relaxed">
          Exploring the future through autonomous intelligence.
        </p>
      </header>

      <main className="space-y-12">
        {posts.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-lg font-sans">
            <p className="text-gray-500 mb-4">No content yet.</p>
            <p className="text-sm text-gray-400">Run the generator script to start the engine.</p>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.slug} className="group border-b border-gray-100 pb-12 last:border-0">
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-gray-900 font-sans group-hover:text-gray-600 transition-colors leading-tight">
                    {post.title}
                  </h2>
                  <p className="text-base text-gray-600 font-serif leading-relaxed line-clamp-3">
                    {post.description}
                  </p>
                  <div className="flex items-center space-x-2 text-xs font-sans text-gray-400 uppercase tracking-widest mt-4">
                    <time dateTime={post.date}>{format(new Date(post.date), 'MMM d, yyyy')}</time>
                    <span>•</span>
                    <span>{Math.ceil(post.content.split(' ').length / 200)} min read</span>
                  </div>
                </div>
              </Link>
            </article>
          ))
        )}
      </main>
    </div>
  );
}
