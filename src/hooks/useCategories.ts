import { useState, useEffect } from 'react';

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  required_documents: string[];
  optional_documents?: string[];
  order_index: number;
  active: boolean;
}

export interface Category {
  category_id: string;
  category_name: string;
  category_description?: string;
  icon?: string;
  color?: string;
  category_order: number;
  category_active: boolean;
  subcategories: Subcategory[];
}

export interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar categorias do banco de dados com suas subcategorias
 * @param categoryType - Tipo de categoria: 'professional' ou 'equipment'
 */
export function useCategories(categoryType: 'professional' | 'equipment' = 'professional'): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/categories?type=${categoryType}`);

      if (!response.ok) {
        throw new Error('Erro ao carregar categorias');
      }

      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [categoryType]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}

/**
 * Helper para buscar subcategorias de uma categoria específica
 */
export function getSubcategoriesForCategory(
  categories: Category[],
  categoryName: string
): Subcategory[] {
  const category = categories.find(c => c.category_name === categoryName);
  return category?.subcategories || [];
}

/**
 * Helper para buscar documentos obrigatórios de múltiplas subcategorias
 */
export function getRequiredDocumentsForSubcategories(
  categories: Category[],
  selectedSubcategorySlugs: string[]
): string[] {
  const basicDocs = ['rg_front', 'rg_back', 'cpf', 'proof_of_address'];
  const specificDocs = new Set<string>();

  categories.forEach(category => {
    category.subcategories.forEach(sub => {
      if (selectedSubcategorySlugs.includes(sub.slug)) {
        sub.required_documents.forEach(doc => specificDocs.add(doc));
      }
    });
  });

  return [...basicDocs, ...Array.from(specificDocs)];
}

/**
 * Helper para converter categorias do banco para o formato usado pelos wizards
 * Mantém compatibilidade com código existente
 */
export function convertToWizardFormat(categories: Category[]) {
  return categories.map(cat => ({
    name: cat.category_name,
    label: cat.category_name,
    subcategories: cat.subcategories.map(sub => ({
      name: sub.slug,
      label: sub.name,
      requiredDocuments: sub.required_documents,
      description: sub.description,
    })),
  }));
}
