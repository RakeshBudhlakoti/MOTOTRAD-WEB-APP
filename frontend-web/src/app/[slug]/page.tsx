import { Metadata, ResolvingMetadata } from 'next';
import { generateSeoMetadata } from '@/lib/seo';
import apiClient from '@/lib/axios';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data: page } = await apiClient.get(`/cms/pages/${slug}`);
    
    return generateSeoMetadata({
      title: page.seoTitle || page.title,
      description: page.seoDescription,
      keywords: page.seoKeywords?.split(','),
      url: `https://mototrad.com/${slug}`,
      type: 'article',
    });
  } catch {
    return generateSeoMetadata({ title: 'Page Not Found' });
  }
}

export default async function DynamicCmsPage({ params }: PageProps) {
  const { slug } = await params;
  
  try {
    const { data: page } = await apiClient.get(`/cms/pages/${slug}`);

    return (
      <article className="max-w-4xl mx-auto px-4 py-20 font-poppins">
        <header className="mb-12">
          <h1 className="text-5xl font-black mb-4 uppercase tracking-tighter">{page.title}</h1>
          <div className="h-1.5 w-24 bg-primary rounded-full"></div>
        </header>
        
        <div 
          className="prose prose-lg dark:prose-invert max-w-none prose-p:text-[#64748B] dark:prose-p:text-[#94A3B8]"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />

        {/* Structured Data (JSON-LD) using Metadata API approach is better, but for now we remove the direct <script> tag which React 19 hates */}
      </article>
    );
  } catch (error) {
    return (
      <div className="container py-20 text-center font-poppins">
        <h1 className="text-4xl font-black mb-4 uppercase">404 - Page Not Found</h1>
        <p className="text-[#64748B]">The page you are looking for does not exist or has been moved.</p>
      </div>
    );
  }
}
