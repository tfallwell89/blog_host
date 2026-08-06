-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grouped_recipes" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grouped_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "groups_blogId_name_idx" ON "groups"("blogId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "groups_blogId_slug_key" ON "groups"("blogId", "slug");

-- CreateIndex
CREATE INDEX "grouped_recipes_recipeId_idx" ON "grouped_recipes"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "grouped_recipes_groupId_recipeId_key" ON "grouped_recipes"("groupId", "recipeId");

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grouped_recipes" ADD CONSTRAINT "grouped_recipes_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grouped_recipes" ADD CONSTRAINT "grouped_recipes_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
