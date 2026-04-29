'use client';

import { ChefHat } from 'lucide-react';
import ArticlesAdminView from '@/components/admin/ArticlesAdminView';

export default function RecipesAdminPage() {
  return (
    <ArticlesAdminView
      lockedType="recipe"
      pageTitle="Recipes"
      singular="Recipe"
      subtitle="Resep masakan dengan produk Mahkota Taiwan"
      translateContext="recipe article"
      icon={ChefHat}
    />
  );
}
