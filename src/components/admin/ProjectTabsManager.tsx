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
      <TabsList className="bg-zinc-900 border-zinc-800 p-1">
        <TabsTrigger
          value="info"
          className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
        >
          <Building2 className="h-4 w-4 mr-2" />
          Informações
        </TabsTrigger>
        <TabsTrigger
          value="team"
          className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
        >
          <Users className="h-4 w-4 mr-2" />
          Equipe ({teamCount})
        </TabsTrigger>
        <TabsTrigger
          value="equipment"
          className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
        >
          <Package className="h-4 w-4 mr-2" />
          Equipamentos ({equipmentCount})
        </TabsTrigger>
        <TabsTrigger
          value="quotations"
          className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Cotações
        </TabsTrigger>
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
