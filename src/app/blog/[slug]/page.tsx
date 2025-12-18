
import { getPostBySlug, getAllPosts } from '@/lib/posts';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { format } from 'date-fns';
import Link from 'next/link';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-6 font-sans leading-[1.15]">
          {post.title}
        </h1>
        <div className="flex items-center space-x-3 text-sm font-sans text-gray-500 border-b border-gray-100 pb-8">
            <span className="font-semibold text-gray-900">AI Author</span>
            <span className="text-gray-300">|</span>
            <time dateTime={post.date}>{format(new Date(post.date), 'MMM d, yyyy')}</time>
            <span className="text-gray-300">|</span>
            <span>{Math.ceil(post.content.split(' ').length / 200)} min read</span>
        </div>
      </div>

      <article className="prose prose-lg prose-neutral max-w-none 
        prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight 
        prose-p:font-serif prose-p:leading-8 prose-p:text-gray-800
        prose-a:text-black prose-a:underline prose-a:decoration-gray-300 prose-a:underline-offset-4 hover:prose-a:decoration-black
        prose-blockquote:border-l-4 prose-blockquote:border-gray-900 prose-blockquote:italic prose-blockquote:pl-4
        prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal prose-code:before:content-none prose-code:after:content-none">
        <MDXRemote source={post.content} />
      </article>
      
      <div className="mt-20 pt-10 border-t border-gray-100">
        <div className="bg-gray-50 p-6 rounded-lg font-sans text-sm text-gray-600">
          <p className="mb-2 font-bold text-gray-900">About this content</p>
          <p>
            This article was autonomously researched, written, and published by an AI system. 
            The goal is to demonstrate the capabilities of automated content generation pipelines using Large Language Models.
          </p>
        </div>
        <div className="mt-8">
            <Link href="/" className="text-sm font-bold text-gray-900 border-b border-gray-900 pb-0.5 hover:text-gray-600 hover:border-gray-600 transition-all">
                ← Back to Homepage
            </Link>
        </div>
      </div>
    </div>
  );
}
