'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Package, DollarSign } from 'lucide-react';

interface ProjectTabsManagerProps {
  teamCount: number;
  equipmentCount: number;
  children: {
    info: React.ReactNode;
    team: React.ReactNode;
    equipment: React.ReactNode;
    quotations: React.ReactNode;
  };
}

export function ProjectTabsManager({
  teamCount,
  equipmentCount,
  children,
}: ProjectTabsManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Pega a aba da URL ou usa 'info' como padrão
  const currentTab = searchParams.get('tab') || 'info';
  const [activeTab, setActiveTab] = useState(currentTab);

  // Atualiza a URL quando muda de aba
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Sincroniza com URL quando voltar/avançar no navegador
  useEffect(() => {
    const tab = searchParams.get('tab') || 'info';
    setActiveTab(tab);
  }, [searchParams]);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList className="!flex w-full h-auto bg-zinc-900 border-zinc-800 p-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 w-full">
          <TabsTrigger
            value="info"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Informações</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Equipe ({teamCount})</span>
            <span className="sm:hidden">Equipe</span>
          </TabsTrigger>
          <TabsTrigger
            value="equipment"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Package className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Equipamentos ({equipmentCount})</span>
            <span className="sm:hidden">Equip.</span>
          </TabsTrigger>
          <TabsTrigger
            value="quotations"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Cotações</span>
            <span className="sm:hidden">Cotações</span>
          </TabsTrigger>
        </div>
      </TabsList>

      <TabsContent value="info" className="space-y-6">
        {children.info}
      </TabsContent>

      <TabsContent value="team">
        {children.team}
      </TabsContent>

      <TabsContent value="equipment">
        {children.equipment}
      </TabsContent>

      <TabsContent value="quotations">
        {children.quotations}
      </TabsContent>
    </Tabs>
  );
}
