
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { siteConfig } from '../../site-config';
import { format } from 'date-fns';

export default async function Home() {
  const posts = await getAllPosts();
  const { profile } = siteConfig;

  return (
    <div className="max-w-2xl mx-auto px-6 py-20 animate-fade-in">
      {/* Hero Section */}
      <section className="mb-24">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6 font-sans leading-tight">
          {profile.name}
        </h1>
        <p className="text-2xl text-gray-800 font-sans font-medium mb-6">
          {profile.role}
        </p>
        <p className="text-xl text-gray-600 font-serif leading-relaxed max-w-xl">
          {profile.bio}
        </p>
        
        <div className="flex items-center space-x-6 mt-8 font-sans text-sm font-bold text-gray-900">
            <a href={`mailto:${profile.email}`} className="hover:text-blue-600 transition-colors">Email</a>
            <a href={profile.social.github} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">GitHub</a>
            <a href={profile.social.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">LinkedIn</a>
            <a href={profile.social.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Twitter</a>
        </div>
      </section>

      <hr className="border-gray-100 my-16" />

      {/* Skills Section */}
      <section className="mb-24">
        <h2 className="text-xl font-bold font-sans text-gray-900 mb-8 uppercase tracking-wider text-xs">Technical Skills</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(profile.skills).map(([category, items]) => (
                <div key={category}>
                    <h3 className="font-bold text-gray-900 mb-2 font-sans">{category}</h3>
                    <p className="text-gray-600 font-serif leading-relaxed">
                        {items.join(", ")}
                    </p>
                </div>
            ))}
        </div>
      </section>

      <hr className="border-gray-100 my-16" />

      {/* Projects Section */}
      <section className="mb-24">
        <h2 className="text-xl font-bold font-sans text-gray-900 mb-8 uppercase tracking-wider text-xs">Selected Work</h2>
        <div className="space-y-12">
            {profile.projects.map((project) => (
                <div key={project.title}>
                    <h3 className="text-xl font-bold text-gray-900 font-sans mb-2">
                        <a href={project.link} className="hover:underline decoration-2 underline-offset-4">{project.title}</a>
                    </h3>
                    <p className="text-gray-600 font-serif leading-relaxed">
                        {project.description}
                    </p>
                </div>
            ))}
        </div>
      </section>

      <hr className="border-gray-100 my-16" />

      {/* Writing Section (The Blog) */}
      <section>
        <h2 className="text-xl font-bold font-sans text-gray-900 mb-8 uppercase tracking-wider text-xs">Recent Writing</h2>
        <div className="space-y-8">
          {posts.length === 0 ? (
            <div className="p-6 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-500 font-sans">No articles published yet.</p>
            </div>
          ) : (
            posts.map((post) => (
              <article key={post.slug} className="group">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900 font-sans group-hover:text-gray-600 transition-colors">
                        {post.title}
                    </h3>
                    <time className="text-sm text-gray-400 font-sans whitespace-nowrap md:ml-4 mt-1 md:mt-0">
                        {format(new Date(post.date), 'MMM d, yyyy')}
                    </time>
                  </div>
                  <p className="text-gray-600 font-serif leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                </Link>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
