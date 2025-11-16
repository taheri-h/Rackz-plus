import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const Blog: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState(t('blog.categories.all'));
  
  // Update selected category when language changes
  useEffect(() => {
    setSelectedCategory(t('blog.categories.all'));
  }, [i18n.language, t]);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const blogPosts = t('blog.posts', { returnObjects: true }) as Array<{
    id: number;
    title: string;
    excerpt: string;
    category: string;
    date: string;
    readTime: string;
    slug: string;
  }>;

  // Add images and author to blog posts
  const blogPostsWithImages = blogPosts.map((post, index) => ({
    ...post,
    author: "Fynteq Team",
    image: [
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1556742111-a301076d9d18?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
    ][index]
  })) as Array<{
    id: number;
    title: string;
    excerpt: string;
    category: string;
    date: string;
    readTime: string;
    slug: string;
    author: string;
    image: string;
  }>;

  // Create category mapping for filtering - maps filter button labels to actual post category values
  const categoryMapping: { [key: string]: string[] } = {
    [t('blog.categories.all')]: [],
    [t('blog.categories.paymentIntegration')]: ['Payment Gateway Integration', 'Zahlungsgateways'],
    [t('blog.categories.saasBilling')]: ['SaaS Zahlungsabwicklung', 'SaaS Billing'],
    [t('blog.categories.paymentGateways')]: ['Payment Gateways', 'Zahlungsgateways', 'Payment Gateway Integration'],
    [t('blog.categories.security')]: ['Payment Gateway Sicherheit', 'Security'],
    [t('blog.categories.uxDesign')]: ['Payment Gateway UX', 'UX Design'],
    [t('blog.categories.international')]: ['Internationale Payment Gateway', 'International Payments']
  };

  const categories = [
    t('blog.categories.all'),
    t('blog.categories.paymentIntegration'),
    t('blog.categories.saasBilling'),
    t('blog.categories.paymentGateways'),
    t('blog.categories.security'),
    t('blog.categories.uxDesign'),
    t('blog.categories.international')
  ];

  const filteredPosts = selectedCategory === t('blog.categories.all')
    ? blogPostsWithImages 
    : blogPostsWithImages.filter(post => {
        const categoryValues = categoryMapping[selectedCategory] || [];
        return categoryValues.some(cat => 
          post.category.toLowerCase().includes(cat.toLowerCase()) || 
          cat.toLowerCase().includes(post.category.toLowerCase())
        );
      });

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Payment Integration Blog - Expert Insights & Best Practices | Fynteq</title>
        <meta name="description" content="Expert insights on payment integration, Stripe setup, PayPal integration, and fintech best practices. Learn from our experience across hundreds of merchant integrations." />
        <meta name="keywords" content="payment integration blog, Stripe integration guide, PayPal setup tutorial, payment processing best practices, fintech insights, payment gateway optimization" />
        <link rel="canonical" href="https://www.fynteq.com/blog" />
        <meta property="og:title" content="Payment Integration Blog - Expert Insights & Best Practices" />
        <meta property="og:description" content="Expert insights on payment integration, Stripe setup, PayPal integration, and fintech best practices." />
        <meta property="og:url" content="https://www.fynteq.com/blog" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Fynteq Payment Integration Blog",
            "description": "Expert insights on payment integration, Stripe setup, PayPal integration, and fintech best practices",
            "url": "https://www.fynteq.com/blog",
            "publisher": {
              "@type": "Organization",
              "name": "Fynteq",
              "url": "https://www.fynteq.com"
            },
            "blogPost": blogPostsWithImages.map(post => ({
              "@type": "BlogPosting",
              "headline": post.title,
              "description": post.excerpt,
              "url": `https://www.fynteq.com/blog/${post.slug}`,
              "datePublished": post.date,
              "author": {
                "@type": "Organization",
                "name": post.author
              },
              "image": post.image,
              "articleSection": post.category
            }))
          })}
        </script>
      </Helmet>
      {/* Hero Section */}
      <section className="bg-white py-20 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            {/* Note: dangerouslySetInnerHTML used for i18n translation - content is trusted */}
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6" dangerouslySetInnerHTML={{__html: t('blog.title')}}>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {t('blog.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Blog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article key={post.id} className="card hover-lift">
                <div className="aspect-video rounded-t-lg mb-6 overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={`${post.title} - Payment integration blog post`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span className="text-slate-500 text-sm">{post.readTime}</span>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-slate-900 mb-3 line-clamp-2">
                    <Link to={`/blog/${post.slug}`} className="hover:text-slate-900 transition-colors">
                      {post.title}
                    </Link>
                  </h2>
                  
                  <p className="text-slate-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{post.author}</span>
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Related Content */}
          <div className="mt-16">
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-100">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">{t('exploreMore.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6">
                  <h4 className="text-lg font-semibold text-slate-900 mb-3">
                    <Link to="/case-studies" className="hover:text-slate-900 transition-colors">
                      {t('exploreMore.successStories.title')}
                    </Link>
                  </h4>
                  <p className="text-slate-600 mb-4">{t('exploreMore.successStories.description')}</p>
                  <Link to="/case-studies" className="text-slate-900 hover:text-slate-800 font-medium">
                    {t('exploreMore.successStories.link')}
                  </Link>
                </div>
                <div className="card p-6">
                  <h4 className="text-lg font-semibold text-slate-900 mb-3">
                    <Link to="/#pricing" className="hover:text-slate-900 transition-colors">
                      {t('exploreMore.ourServices.title')}
                    </Link>
                  </h4>
                  <p className="text-slate-600 mb-4">{t('exploreMore.ourServices.description')}</p>
                  <Link to="/#pricing" className="text-slate-900 hover:text-slate-800 font-medium">
                    {t('exploreMore.ourServices.link')}
                  </Link>
                </div>
                <div className="card p-6">
                  <h4 className="text-lg font-semibold text-slate-900 mb-3">
                    <Link to="/#contact" className="hover:text-slate-900 transition-colors">
                      {t('exploreMore.getExpertHelp.title')}
                    </Link>
                  </h4>
                  <p className="text-slate-600 mb-4">{t('exploreMore.getExpertHelp.description')}</p>
                  <Link to="/#contact" className="text-slate-900 hover:text-slate-800 font-medium">
                    {t('exploreMore.getExpertHelp.link')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Blog;
