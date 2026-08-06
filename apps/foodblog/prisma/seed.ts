import { PrismaClient, type Prisma } from '@prisma/client';

import { hashPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'jane@bloghost.dev';
const DEMO_PASSWORD = 'RoastedGarlic22';
const DEMO_SUBDOMAIN = 'janes-kitchen';

interface SeedRecipe {
  title: string;
  slug: string;
  description: string;
  introduction: string;
  featuredImageUrl: string;
  prepMinutes: number;
  cookMinutes: number;
  additionalMinutes?: number;
  servings: number;
  cuisine: string;
  course: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  notes?: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedDaysAgo?: number;
  ingredientGroups: { title: string; ingredients: string[] }[];
  instructionGroups: { title: string; steps: string[] }[];
}

const recipes: SeedRecipe[] = [
  {
    title: 'Lemon Garlic Butter Chicken',
    slug: 'lemon-garlic-butter-chicken',
    description:
      'Golden chicken thighs in a glossy lemon and garlic pan sauce. On the table in half an hour.',
    introduction:
      'This is the dinner I make when the week has been long and the fridge is nearly empty. Chicken thighs go into a hot pan skin-side down and stay there until the skin is properly crisp, then the same pan becomes a lemony butter sauce. Serve it with bread you do not mind ruining, because you will want to mop the pan.',
    featuredImageUrl:
      'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=1400&q=80',
    prepMinutes: 10,
    cookMinutes: 25,
    servings: 4,
    cuisine: 'Mediterranean',
    course: 'Main course',
    difficulty: 'EASY',
    notes:
      'Bone-in thighs give you the best skin, but boneless work if you drop the oven time to 8 minutes. The sauce splits if it boils hard — keep it at a lazy simmer once the butter goes in.',
    status: 'PUBLISHED',
    publishedDaysAgo: 4,
    ingredientGroups: [
      {
        title: 'For the chicken',
        ingredients: [
          '8 bone-in, skin-on chicken thighs',
          '1 tbsp olive oil',
          '1 tsp flaky sea salt',
          '½ tsp freshly ground black pepper',
          '1 tsp smoked paprika',
        ],
      },
      {
        title: 'For the sauce',
        ingredients: [
          '6 garlic cloves, thinly sliced',
          '150ml chicken stock',
          'Juice and zest of 1 large lemon',
          '60g cold unsalted butter, cubed',
          '2 tbsp flat-leaf parsley, chopped',
        ],
      },
    ],
    instructionGroups: [
      {
        title: 'Prepare the chicken',
        steps: [
          'Heat the oven to 200°C (180°C fan). Pat the chicken thighs completely dry — wet skin steams instead of crisping.',
          'Season the thighs all over with the salt, pepper and smoked paprika.',
          'Warm the olive oil in a large ovenproof skillet over medium-high heat. Lay the thighs in skin-side down and leave them alone for 8 minutes, until the skin releases easily and is deep gold.',
          'Turn the thighs over and slide the pan into the oven for 12 minutes, until the juices run clear. Move the chicken to a plate and rest it while you build the sauce.',
        ],
      },
      {
        title: 'Finish the sauce',
        steps: [
          'Pour off all but a tablespoon of fat. Return the pan to medium heat, add the garlic and cook for 45 seconds until fragrant but not coloured.',
          'Pour in the stock and lemon juice, scraping up every browned bit from the base of the pan. Simmer for 3 minutes until slightly reduced.',
          'Drop the heat to low and whisk in the cold butter a few cubes at a time until the sauce turns glossy. Stir through the lemon zest and parsley.',
          'Return the chicken and any resting juices to the pan, spoon the sauce over and serve straight from the skillet.',
        ],
      },
    ],
  },
  {
    title: 'Slow-Roasted Tomato and White Bean Soup',
    slug: 'slow-roasted-tomato-white-bean-soup',
    description:
      'Roasting the tomatoes for an hour turns a tin-cupboard soup into something worth writing down.',
    introduction:
      'Every food blog needs a tomato soup and this is mine. The work is entirely hands-off: tomatoes and garlic go into a low oven and come out sweet and slightly jammy. White beans give it body without cream, so it stays light enough to eat twice in one week.',
    featuredImageUrl:
      'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=80',
    prepMinutes: 15,
    cookMinutes: 70,
    servings: 6,
    cuisine: 'Italian',
    course: 'Soup',
    difficulty: 'EASY',
    notes:
      'Freezes beautifully for three months. Hold back the basil until you reheat it, otherwise it turns grey.',
    status: 'PUBLISHED',
    publishedDaysAgo: 11,
    ingredientGroups: [
      {
        title: 'For the roasted tomatoes',
        ingredients: [
          '1.2kg ripe plum tomatoes, halved',
          '1 whole head of garlic, top sliced off',
          '3 tbsp olive oil',
          '1 tsp caster sugar',
          '1 tsp sea salt',
        ],
      },
      {
        title: 'For the soup',
        ingredients: [
          '1 large onion, diced',
          '2 x 400g tins cannellini beans, drained',
          '700ml vegetable stock',
          '1 tbsp red wine vinegar',
          'A large handful of basil leaves',
        ],
      },
    ],
    instructionGroups: [
      {
        title: 'Roast the tomatoes',
        steps: [
          'Heat the oven to 160°C (140°C fan). Spread the tomatoes cut-side up on a large tray and tuck the head of garlic in among them.',
          'Drizzle everything with 2 tablespoons of the olive oil and scatter over the sugar and salt.',
          'Roast for 1 hour, until the edges of the tomatoes have caught and the garlic is soft enough to squeeze out of its skin.',
        ],
      },
      {
        title: 'Build the soup',
        steps: [
          'Warm the remaining oil in a large pot over medium heat and soften the onion for 8 minutes without letting it colour.',
          'Squeeze in the roasted garlic, then tip in the tomatoes with every drop of juice from the tray.',
          'Add the beans and stock, bring to a gentle simmer and cook for 10 minutes.',
          'Blend until smooth — or leave it half-blended if you like texture. Finish with the vinegar and a handful of torn basil, then taste and adjust the salt.',
        ],
      },
    ],
  },
  {
    title: 'Brown Butter Chocolate Chunk Cookies',
    slug: 'brown-butter-chocolate-chunk-cookies',
    description:
      'Deeply caramelised cookies with crisp edges, a soft middle and pools of dark chocolate.',
    introduction:
      'The overnight rest is not optional. It hydrates the flour and gives the browned butter time to do its work, and the difference between a same-day cookie and a rested one is the difference between good and the sort of cookie people ask you about a year later.',
    featuredImageUrl:
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1400&q=80',
    prepMinutes: 25,
    cookMinutes: 12,
    additionalMinutes: 720,
    servings: 18,
    cuisine: 'American',
    course: 'Dessert',
    difficulty: 'MEDIUM',
    notes:
      'Chop a bar of chocolate rather than using chips — the shards melt into ribbons instead of staying as buttons.',
    status: 'PUBLISHED',
    publishedDaysAgo: 21,
    ingredientGroups: [
      {
        title: 'For the dough',
        ingredients: [
          '225g unsalted butter',
          '200g light brown soft sugar',
          '100g caster sugar',
          '2 large eggs, plus 1 yolk',
          '2 tsp vanilla extract',
          '310g plain flour',
          '1 tsp bicarbonate of soda',
          '1 tsp fine sea salt',
        ],
      },
      {
        title: 'To finish',
        ingredients: [
          '250g dark chocolate (70%), roughly chopped',
          'Flaky sea salt, for scattering',
        ],
      },
    ],
    instructionGroups: [
      {
        title: 'Brown the butter',
        steps: [
          'Melt the butter in a light-coloured saucepan over medium heat, swirling often, until it foams, quietens and smells of toasted hazelnuts — about 6 minutes.',
          'Pour it into a large bowl, scraping in the brown solids from the base, and leave to cool for 20 minutes until barely warm.',
        ],
      },
      {
        title: 'Mix and rest',
        steps: [
          'Whisk both sugars into the cooled butter, then beat in the eggs, yolk and vanilla until the mixture turns glossy and slightly paler.',
          'Fold in the flour, bicarbonate of soda and salt until just combined, then stir through the chopped chocolate.',
          'Cover the bowl and refrigerate overnight, or for at least 12 hours.',
        ],
      },
      {
        title: 'Bake',
        steps: [
          'Heat the oven to 190°C (170°C fan) and line two trays with baking paper.',
          'Scoop 60g balls of dough onto the trays, leaving plenty of space between them.',
          'Bake for 11–12 minutes, until the edges are set and the centres still look underdone.',
          'Scatter with flaky salt and leave on the tray for 10 minutes to finish setting before moving them.',
        ],
      },
    ],
  },
  {
    title: 'Miso Butter Mushroom Pasta',
    slug: 'miso-butter-mushroom-pasta',
    description:
      'A savoury weeknight pasta built on browned mushrooms and a spoonful of white miso.',
    introduction:
      'Still testing this one — the miso quantity is right but I want to try it with a mix of chestnut and oyster mushrooms before I publish it properly.',
    featuredImageUrl:
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1400&q=80',
    prepMinutes: 10,
    cookMinutes: 20,
    servings: 2,
    cuisine: 'Japanese-Italian',
    course: 'Main course',
    difficulty: 'EASY',
    status: 'DRAFT',
    ingredientGroups: [
      {
        title: 'For the pasta',
        ingredients: [
          '200g linguine',
          '300g chestnut mushrooms, torn',
          '2 tbsp olive oil',
          '2 garlic cloves, crushed',
        ],
      },
      {
        title: 'For the miso butter',
        ingredients: [
          '50g unsalted butter, softened',
          '1½ tbsp white miso paste',
          '1 tsp soy sauce',
          '2 spring onions, finely sliced',
        ],
      },
    ],
    instructionGroups: [
      {
        title: 'Brown the mushrooms',
        steps: [
          'Heat the oil in a wide pan over high heat and add the mushrooms in a single layer. Leave them undisturbed for 4 minutes so they colour rather than steam.',
          'Toss, add the garlic and cook for another 3 minutes until deeply golden.',
        ],
      },
      {
        title: 'Bring it together',
        steps: [
          'Cook the linguine in well-salted water until one minute short of the packet time, then reserve a mugful of the cooking water.',
          'Mash the butter with the miso and soy sauce, then stir it into the mushrooms off the heat.',
          'Add the drained pasta and a splash of the cooking water, tossing hard until the sauce clings. Finish with the spring onions.',
        ],
      },
    ],
  },
];

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function toRecipeCreateInput(recipe: SeedRecipe, blogId: string): Prisma.RecipeCreateInput {
  return {
    blog: { connect: { id: blogId } },
    title: recipe.title,
    slug: recipe.slug,
    description: recipe.description,
    introduction: recipe.introduction,
    featuredImageUrl: recipe.featuredImageUrl,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    additionalMinutes: recipe.additionalMinutes ?? null,
    servings: recipe.servings,
    cuisine: recipe.cuisine,
    course: recipe.course,
    difficulty: recipe.difficulty,
    notes: recipe.notes ?? null,
    status: recipe.status,
    publishedAt: recipe.publishedDaysAgo === undefined ? null : daysAgo(recipe.publishedDaysAgo),
    ingredientGroups: {
      create: recipe.ingredientGroups.map((group, groupIndex) => ({
        title: group.title,
        position: groupIndex,
        ingredients: {
          create: group.ingredients.map((text, index) => ({ text, position: index })),
        },
      })),
    },
    instructionGroups: {
      create: recipe.instructionGroups.map((group, groupIndex) => ({
        title: group.title,
        position: groupIndex,
        steps: {
          create: group.steps.map((text, index) => ({ text, position: index })),
        },
      })),
    },
  };
}

async function main(): Promise<void> {
  // Cascading deletes clear the blog, recipes and everything beneath them.
  await prisma.blog.deleteMany({ where: { subdomain: DEMO_SUBDOMAIN } });
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      displayName: 'Jane Okafor',
      passwordHash: await hashPassword(DEMO_PASSWORD),
      emailVerifiedAt: new Date(),
    },
  });

  const blog = await prisma.blog.create({
    data: {
      name: "Jane's Kitchen",
      subdomain: DEMO_SUBDOMAIN,
      description:
        'Unfussy recipes for busy weeknights and slow weekends, tested in a very small London kitchen.',
      authorName: 'Jane Okafor',
      brandColor: '#B4531F',
      members: { create: { userId: user.id, role: 'OWNER' } },
    },
  });

  for (const recipe of recipes) {
    await prisma.recipe.create({ data: toRecipeCreateInput(recipe, blog.id) });
  }

  const published = recipes.filter((recipe) => recipe.status === 'PUBLISHED').length;

  console.warn(
    [
      'Seed complete.',
      `  Blog:     ${blog.name} (/${blog.subdomain})`,
      `  Recipes:  ${published} published, ${recipes.length - published} draft`,
      `  Sign in:  ${DEMO_EMAIL} / ${DEMO_PASSWORD}`,
    ].join('\n'),
  );
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
