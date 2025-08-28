import { useState } from "react";
import { File, Shapes, Target, Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentTable } from "./DocumentTable";

const mockFiles = [
  { name: "AI_Policy_Document_April_2025", totalItems: 22 },
  { name: "CalPERS Pension Fund Global Fixed Income Strategy Management", totalItems: 3 },
  { name: "Comprehensive Request for Proposal (RFP)", totalItems: 1 },
  { name: "ESG Triple-Double Fund: Request for Proposal (RFP)", totalItems: 20 },
  { name: "Global Emerging Markets Dunk Fund: Request for Proposal (RFP)", totalItems: 16 },
  { name: "Investment Approach", totalItems: 50 },
  { name: "Investment Management Proposal", totalItems: 4 },
  { name: "Large-Cap All-Star Fund: Request for Proposal (RFP)", totalItems: 26 },
];

const mockTypes = [
  { name: "Commentary", totalItems: 45 },
  { name: "Policy", totalItems: 67 },
  { name: "Questionnaire", totalItems: 30 },
];

const mockStrategies = [
  { name: "Firm Wide (Not Strategy-Specific)", totalItems: 89 },
  { name: "Large Cap Growth", totalItems: 32 },
  { name: "Small Cap Growth", totalItems: 21 },
];

interface VaultTabsProps {
  onFileClick?: (fileName: string) => void;
}

export function VaultTabs({ onFileClick }: VaultTabsProps) {
  const [activeTab, setActiveTab] = useState("files");

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-medium">Documents</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="inline-flex bg-transparent p-0 h-auto gap-1">
          <TabsTrigger 
            value="files" 
            className="inline-grid grid-flow-col items-center gap-2 px-2 py-2 h-8 rounded-lg text-[#71717A] bg-transparent hover:bg-[#F4F4F5] hover:text-[#09090B] data-[state=active]:bg-[#F4F4F5] data-[state=active]:text-[#09090B] data-[state=active]:shadow-none transition-colors"
          >
            <File className="h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger 
            value="type" 
            className="inline-grid grid-flow-col items-center gap-2 px-2 py-2 h-8 rounded-lg text-[#71717A] bg-transparent hover:bg-[#F4F4F5] hover:text-[#09090B] data-[state=active]:bg-[#F4F4F5] data-[state=active]:text-[#09090B] data-[state=active]:shadow-none transition-colors"
          >
            <Shapes className="h-4 w-4" />
            Type
          </TabsTrigger>
          <TabsTrigger 
            value="strategy" 
            className="inline-grid grid-flow-col items-center gap-2 px-2 py-2 h-8 rounded-lg text-[#71717A] bg-transparent hover:bg-[#F4F4F5] hover:text-[#09090B] data-[state=active]:bg-[#F4F4F5] data-[state=active]:text-[#09090B] data-[state=active]:shadow-none transition-colors"
          >
            <Target className="h-4 w-4" />
            Strategy
          </TabsTrigger>
          <TabsTrigger 
            value="data" 
            className="inline-grid grid-flow-col items-center gap-2 px-2 py-2 h-8 rounded-lg text-[#71717A] bg-transparent hover:bg-[#F4F4F5] hover:text-[#09090B] data-[state=active]:bg-[#F4F4F5] data-[state=active]:text-[#09090B] data-[state=active]:shadow-none transition-colors"
          >
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="mt-6">
          <DocumentTable data={mockFiles} onFileClick={onFileClick} />
        </TabsContent>

        <TabsContent value="type" className="mt-6">
          <DocumentTable data={mockTypes} onFileClick={onFileClick} />
        </TabsContent>

        <TabsContent value="strategy" className="mt-6">
          <DocumentTable data={mockStrategies} onFileClick={onFileClick} />
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Data Available</h3>
            <p className="text-muted-foreground">
              Policy documents for the Microsoft Word plugin will appear here.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}