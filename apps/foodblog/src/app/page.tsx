import { buttonClassName } from '@bloghost/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { getCurrentUser } from '@/lib/auth/session';
import { getBlogBySubdomain } from '@/lib/blog/queries';
import { formatMinutes } from '@/lib/recipes/format';
import { getPublishedRecipes, type PublicRecipeCard } from '@/lib/recipes/queries';
import { blogPath } from '@/lib/tenant';

import '@/styles/marketing.css';

export const metadata: Metadata = {
  title: 'Start your very own food blog in 10 minutes',
  description:
    'BlogHost gives you a hosted food blog with a recipe editor built for cooks. Name your blog, choose a design and publish your first recipe — no WordPress, plugins, hosting setup or code.',
  alternates: { canonical: '/' },
};

const DEMO_SUBDOMAIN = 'janes-kitchen';

const STEPS = [
  {
    title: 'Name your blog',
    body: 'Pick a name and a web address. We handle the hosting, the SSL and the boring parts.',
  },
  {
    title: 'Choose a design',
    body: 'Three finished themes made for food photography. Switch between them whenever you like.',
  },
  {
    title: 'Publish your first recipe',
    body: 'A real recipe editor with ingredient groups, numbered steps, timings and notes.',
  },
];

const REASONS = [
  {
    title: 'No WordPress',
    body: 'Nothing to install, update or break at midnight before a big post goes out.',
  },
  {
    title: 'No plugins',
    body: 'Recipe cards, structured data and print-friendly pages are built in from day one.',
  },
  {
    title: 'No hosting setup',
    body: 'Your blog is live on the internet the moment you finish the three steps.',
  },
  {
    title: 'No code',
    body: 'If you can write a recipe on paper, you can publish one here.',
  },
];

/** Preview content used when the demo blog has not been seeded. */
const FALLBACK_PREVIEW = {
  name: "Jane's Kitchen",
  description: 'Unfussy recipes for busy weeknights and slow weekends.',
  href: `/site/${DEMO_SUBDOMAIN}`,
  recipes: [
    {
      title: 'Lemon Garlic Butter Chicken',
      meta: 'Main course · 35 mins',
      image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&w=600&q=70',
    },
    {
      title: 'Slow-Roasted Tomato Soup',
      meta: 'Soup · 85 mins',
      image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&w=600&q=70',
    },
    {
      title: 'Brown Butter Cookies',
      meta: 'Dessert · 37 mins',
      image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&w=600&q=70',
    },
  ],
};

function recipeMeta(recipe: PublicRecipeCard): string {
  const total = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
  return [recipe.course ?? recipe.cuisine, formatMinutes(total)].filter(Boolean).join(' · ');
}

async function loadPreview() {
  try {
    const blog = await getBlogBySubdomain(DEMO_SUBDOMAIN);
    if (!blog) return FALLBACK_PREVIEW;

    const recipes = await getPublishedRecipes(blog.id);
    if (recipes.length === 0) return FALLBACK_PREVIEW;

    return {
      name: blog.name,
      description: blog.description,
      href: blogPath(blog.subdomain),
      recipes: recipes.slice(0, 3).map((recipe) => ({
        title: recipe.title,
        meta: recipeMeta(recipe),
        image: recipe.featuredImageUrl,
      })),
    };
  } catch {
    // The marketing page must stay up even when the database is unreachable.
    return FALLBACK_PREVIEW;
  }
}

export default async function LandingPage() {
  const [user, preview] = await Promise.all([getCurrentUser(), loadPreview()]);

  return (
    <div className="marketing">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="marketing__header">
        <div className="page marketing__header-inner">
          <Link className="brand" href="/">
            <span className="brand__mark" aria-hidden="true">
              🍳
            </span>
            BlogHost
          </Link>
          <nav className="marketing__nav" aria-label="Main">
            <a className="marketing__nav-link marketing__nav-link--muted" href="#how-it-works">
              How it works
            </a>
            {user ? (
              <Link className={buttonClassName({ size: 'sm' })} href="/dashboard">
                Go to your dashboard
              </Link>
            ) : (
              <>
                <Link className="marketing__nav-link" href="/sign-in">
                  Sign in
                </Link>
                <Link className={buttonClassName({ size: 'sm' })} href="/sign-up">
                  Start your food blog
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="hero">
          <div className="page hero__inner">
            <p className="hero__eyebrow">Hosted food blogs for home cooks</p>
            <h1 className="hero__title">Start your very own food blog in 10 minutes</h1>
            <p className="hero__subtitle">
              BlogHost is everything you need to publish recipes online, ready to go. There is no
              WordPress to install, no plugins to configure, no hosting to set up and no code to
              write — just your recipes, on a site that looks like you meant it.
            </p>
            <div className="hero__actions">
              <Link className={buttonClassName({ size: 'lg' })} href="/sign-up">
                Start your food blog
              </Link>
              <Link
                className={buttonClassName({ variant: 'secondary', size: 'lg' })}
                href={preview.href}
              >
                See an example blog
              </Link>
            </div>
            <ul className="hero__reassurance">
              <li>Free while you set up</li>
              <li>Your recipes stay yours</li>
              <li>Print-friendly recipe pages</li>
            </ul>
          </div>
        </section>

        <section className="section section--tinted" id="how-it-works">
          <div className="page">
            <div className="section__head">
              <h2 className="section__title">Three steps to a live food blog</h2>
              <p className="section__lede">
                Most people are publishing their first recipe before the kettle has boiled.
              </p>
            </div>
            <ol className="steps">
              {STEPS.map((step, index) => (
                <li className="step" key={step.title}>
                  <span className="step__number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <h3 className="step__title">{step.title}</h3>
                  <p className="step__body">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section">
          <div className="page">
            <div className="section__head">
              <h2 className="section__title">This is what your readers will see</h2>
              <p className="section__lede">
                Every blog gets a recipe index, individual recipe pages with ingredients and
                numbered steps, and structured data so search engines understand your cooking.
              </p>
            </div>

            <div className="preview">
              <div className="preview__chrome" aria-hidden="true">
                <div className="preview__dots">
                  <span className="preview__dot" />
                  <span className="preview__dot" />
                  <span className="preview__dot" />
                </div>
                <div className="preview__address">bloghost.app{preview.href}</div>
              </div>
              <div className="preview__body">
                <div className="preview__masthead">
                  <p className="preview__blog-name">{preview.name}</p>
                  <p className="preview__blog-tagline">{preview.description}</p>
                </div>
                <div className="preview__grid">
                  {preview.recipes.map((recipe) => (
                    <article className="preview__card" key={recipe.title}>
                      {recipe.image ? (
                        <img
                          className="preview__image"
                          src={recipe.image}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="preview__image" />
                      )}
                      <div className="preview__card-body">
                        <h3 className="preview__card-title">{recipe.title}</h3>
                        <p className="preview__card-meta">{recipe.meta}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div className="preview__footer">
              <Link className={buttonClassName({ variant: 'secondary' })} href={preview.href}>
                Visit the example food blog
              </Link>
              <span className="text-sm muted">A real blog running on BlogHost</span>
            </div>
          </div>
        </section>

        <section className="section section--tinted">
          <div className="page">
            <div className="section__head">
              <h2 className="section__title">Built for cooks, not webmasters</h2>
              <p className="section__lede">
                The things food bloggers usually spend a weekend wiring together are simply part of
                the product.
              </p>
            </div>
            <ul className="reasons">
              {REASONS.map((reason) => (
                <li className="reason" key={reason.title}>
                  <h3 className="reason__title">{reason.title}</h3>
                  <p className="reason__body">{reason.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section">
          <div className="page page--narrow">
            <div className="closing">
              <h2 className="section__title">Your first recipe is ten minutes away</h2>
              <p className="section__lede">
                Create an account, name your food blog and publish something you cooked this week.
              </p>
              <Link className={buttonClassName({ size: 'lg' })} href="/sign-up">
                Start your food blog
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="marketing__footer">
        <div className="page marketing__footer-inner">
          <span>© {new Date().getFullYear()} BlogHost</span>
          <span>Hosted food blogs, made simple.</span>
        </div>
      </footer>
    </div>
  );
}
