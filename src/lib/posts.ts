
import connectDB from './db/connect';
import { Post as PostModel, IPost } from './db/models';

export type Post = {
  slug: string;
  title: string;
  date: string;
  description: string;
  content: string;
};

// Now generic to allow sorting or simple retrieval
export async function getAllPosts(): Promise<Post[]> {
  console.log("getAllPosts: Connecting to DB...");
  await connectDB();
  console.log("getAllPosts: Connected. Querying posts...");
  const posts = await PostModel.find({}).sort({ date: -1 }).lean();
  console.log(`getAllPosts: Found ${posts.length} posts.`);
  
  return posts.map((post: any) => ({
    slug: post.slug,
    title: post.title,
    date: post.date.toISOString(), // Ensure string format
    description: post.description || '',
    content: post.content,
  }));
}

export async function getPostBySlug(slug: string): Promise<Post> {
  await connectDB();
  const post = await PostModel.findOne({ slug }).lean();
  
  if (!post) {
    throw new Error(`Post not found: ${slug}`);
  }

  return {
    slug: (post as any).slug,
    title: (post as any).title,
    date: (post as any).date.toISOString(),
    description: (post as any).description || '',
    content: (post as any).content,
  };
}
