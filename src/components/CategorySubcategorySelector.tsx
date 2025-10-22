/**
 * Componente de Seleção de Categorias e Subcategorias - COMPACTO
 * Padrão visual: Vermelho + Zinc (sem preto)
 */

'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CertificationUpload } from '@/components/CertificationUpload';
import {
  CATEGORIES_WITH_SUBCATEGORIES,
  type SubcategoryConfig,
} from '@/lib/categories-subcategories';
import {
  getCertificationConfig,
  type Certifications,
  type Certification,
  type Subcategories,
} from '@/types/certification';

interface CategorySubcategorySelectorProps {
  selectedSubcategories: Subcategories;
  certifications: Certifications;
  onSubcategoriesChange: (subcategories: Subcategories) => void;
  onCertificationChange: (certCode: string, cert: Partial<Certification>) => void;
  onCertificationUpload: (certCode: string, file: File) => Promise<{ url?: string; error?: string }>;
  disabled?: boolean;
}

export function CategorySubcategorySelector({
  selectedSubcategories,
  certifications,
  onSubcategoriesChange,
  onCertificationChange,
  onCertificationUpload,
  disabled = false,
}: CategorySubcategorySelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Auto-expandir categorias com subcategorias selecionadas
  useEffect(() => {
    const categoriesToExpand = new Set<string>();
    Object.keys(selectedSubcategories).forEach((categoryName) => {
      if (selectedSubcategories[categoryName].length > 0) {
        categoriesToExpand.add(categoryName);
      }
    });
    setExpandedCategories(categoriesToExpand);
  }, [selectedSubcategories]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  const toggleSubcategory = (categoryName: string, subcategoryCode: string) => {
    const currentSubs = selectedSubcategories[categoryName] || [];
    const newSubs = currentSubs.includes(subcategoryCode)
      ? currentSubs.filter((s) => s !== subcategoryCode)
      : [...currentSubs, subcategoryCode];

    onSubcategoriesChange({
      ...selectedSubcategories,
      [categoryName]: newSubs,
    });
  };

  const isSubcategorySelected = (categoryName: string, subcategoryCode: string): boolean => {
    return (selectedSubcategories[categoryName] || []).includes(subcategoryCode);
  };

  const getRequiredDocuments = (subcategory: SubcategoryConfig): string[] => {
    return subcategory.requiredDocuments || [];
  };

  const getSelectedCount = (categoryName: string): number => {
    return (selectedSubcategories[categoryName] || []).length;
  };

  const areDocumentsComplete = (requiredDocs: string[]): boolean => {
    if (requiredDocs.length === 0) return true;

    return requiredDocs.every((docCode) => {
      const cert = certifications[docCode];
      if (!cert || !cert.document_url) return false;

      const config = getCertificationConfig(docCode);
      if (!config) return false;

      if (config.requiresNumber && !cert.number) return false;
      if (config.requiresValidity && !cert.validity) return false;
      if (config.requiresCategory && !cert.category) return false;

      return true;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-zinc-200">Categorias Profissionais</Label>
        <p className="text-xs text-zinc-500">
          Selecione suas áreas de atuação
        </p>
      </div>

      {/* Grid de categorias - 2 colunas em desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {CATEGORIES_WITH_SUBCATEGORIES.map((category) => {
          const isExpanded = expandedCategories.has(category.name);
          const selectedCount = getSelectedCount(category.name);

          return (
            <div
              key={category.name}
              className="border border-zinc-800 bg-zinc-800/50 rounded-md overflow-hidden"
            >
              {/* Header da categoria */}
              <button
                type="button"
                onClick={() => toggleCategory(category.name)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-700/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-zinc-400 transition-transform flex-shrink-0',
                      isExpanded && 'rotate-180'
                    )}
                  />
                  <span className="text-sm font-medium text-zinc-200 truncate">
                    {category.label}
                  </span>
                </div>

                {selectedCount > 0 && (
                  <Badge className="bg-red-600 text-white text-xs px-2 py-0.5 flex-shrink-0">
                    {selectedCount}
                  </Badge>
                )}
              </button>

              {/* Conteúdo expandido */}
              {isExpanded && (
                <div className="border-t border-zinc-700 px-3 py-2 bg-zinc-900/50 space-y-2">
                  {category.subcategories.map((subcategory) => {
                    const isSelected = isSubcategorySelected(category.name, subcategory.name);
                    const requiredDocs = getRequiredDocuments(subcategory);
                    const docsComplete = areDocumentsComplete(requiredDocs);

                    return (
                      <div key={subcategory.name} className="space-y-2">
                        {/* Checkbox da subcategoria */}
                        <div className="flex items-center gap-2 p-2 rounded hover:bg-zinc-800/30 transition-colors">
                          <Checkbox
                            id={`subcat-${category.name}-${subcategory.name}`}
                            checked={isSelected}
                            onCheckedChange={() =>
                              toggleSubcategory(category.name, subcategory.name)
                            }
                            disabled={disabled}
                            className="border-zinc-700 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                          />
                          <Label
                            htmlFor={`subcat-${category.name}-${subcategory.name}`}
                            className="text-sm text-zinc-300 cursor-pointer flex-1 font-normal select-none"
                          >
                            {subcategory.label}
                          </Label>

                          {/* Indicador de documentos */}
                          {requiredDocs.length > 0 && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-xs text-zinc-600">
                                {requiredDocs.length} doc{requiredDocs.length > 1 ? 's' : ''}
                              </span>
                              {isSelected && (
                                docsComplete ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                                )
                              )}
                            </div>
                          )}
                        </div>

                        {/* Documentos necessários - apenas se selecionada */}
                        {isSelected && requiredDocs.length > 0 && (
                          <div className="ml-6 pl-3 border-l-2 border-zinc-800 space-y-2">
                            {requiredDocs.map((docCode) => {
                              const config = getCertificationConfig(docCode);
                              if (!config) return null;

                              return (
                                <CertificationUpload
                                  key={docCode}
                                  config={config}
                                  certification={certifications[docCode]}
                                  onUpload={(file) => onCertificationUpload(docCode, file)}
                                  onChange={(cert) => onCertificationChange(docCode, cert)}
                                  disabled={disabled}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
