import { useState } from "react";
import { Search, Upload, Copy, Building, Tag, ChevronDown, Filter, ArrowUpDown, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { QuestionCard, QuestionCardData } from "./QuestionCard";
import { QuestionSheet } from "./QuestionSheet";
import { SingleFileView } from "./SingleFileView";
import { AppSidebar } from "./AppSidebar";

// Mock data for all content items
const mockContentItems: QuestionCardData[] = [
  {
    id: "1",
    fileName: "AI_Policy_Document_April_2025",
    updatedAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedBy: "Brian",
    question: "What specific pre-approval requirements must Granite Peak employees adhere to when using AI Systems involving proprietary information?",
    answer: "II. PRE-APPROVAL REQUIREMENT Granite Peak employees are prohibited from using any AI Systems involving the consumption of data or proprietary information related to Granite Peak's business without specific authorization from the Deputy CCO and the Director of Operations.",
    duration: "Evergreen",
    strategy: "Firm Wide (Not Strategy Specific)",
    tags: ["DDQ", "RFP"]
  },
  {
    id: "2",
    fileName: "Large-Cap All-Star Fund: Request for Proposal (RFP)",
    updatedAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedBy: "Mary",
    question: "What is your investment approach for large-cap growth strategies?",
    answer: "Our large-cap growth strategy focuses on companies with sustainable competitive advantages, strong management teams, and consistent earnings growth. We employ a fundamental research approach...",
    duration: "2 Years",
    strategy: "Large Cap Growth",
    tags: ["Investment Strategy", "RFP"]
  },
  {
    id: "3",
    fileName: "ESG Triple-Double Fund: Request for Proposal (RFP)",
    updatedAt: new Date(Date.now() - 259200000), // 3 days ago
    updatedBy: "Sarah",
    question: "How do you integrate ESG factors into your investment process?",
    answer: "ESG integration is fundamental to our investment process. We evaluate environmental, social, and governance factors alongside traditional financial metrics to identify sustainable investment opportunities...",
    duration: "1 Year",
    strategy: "Small Cap Growth",
    tags: ["ESG", "Sustainability", "RFP"]
  },
  {
    id: "4",
    fileName: "Investment Management Proposal",
    updatedAt: new Date(Date.now() - 345600000), // 4 days ago
    updatedBy: "John",
    question: "What are your risk management procedures?",
    answer: "Our risk management framework includes portfolio diversification, position sizing limits, stress testing, and regular risk monitoring. We employ quantitative and qualitative risk assessment tools...",
    duration: "Evergreen",
    strategy: "Firm Wide (Not Strategy Specific)",
    tags: ["Risk Management", "Policy"]
  },
  {
    id: "5",
    fileName: "Comprehensive Request for Proposal (RFP)",
    updatedAt: new Date(Date.now() - 432000000), // 5 days ago
    updatedBy: "Alex",
    question: "What is your fee structure?",
    answer: "Our management fees are tiered based on assets under management and investment strategy. For institutional accounts over $50 million, our standard fee schedule ranges from 0.75% to 1.25%...",
    duration: "6 Months",
    strategy: "Firm Wide (Not Strategy Specific)",
    tags: ["Fees", "Commercial", "DDQ"]
  }
];

const strategies = [
  "All Strategies",
  "Firm Wide (Not Strategy Specific)",
  "Large Cap Growth", 
  "Small Cap Growth"
];

const contentTypes = [
  "All Types",
  "Questions/Answers",
  "Policies", 
  "Commentary"
];

const sortOptions = [
  { label: "Last Updated", value: "lastUpdated" },
  { label: "Expiration Date", value: "expirationDate" },
  { label: "Relevance", value: "relevance" }
];

export function VaultLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionCardData | null>(null);
  
  // Filter states
  const [selectedStrategy, setSelectedStrategy] = useState("All Strategies");
  const [selectedContentType, setSelectedContentType] = useState("All Types");
  const [sortBy, setSortBy] = useState("lastUpdated");

  const handleFileClick = (fileName: string) => {
    setSelectedFile(fileName);
  };

  const handleBackFromFile = () => {
    setSelectedFile(null);
  };

  const handleEditQuestion = (questionData: QuestionCardData) => {
    setEditingQuestion(questionData);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedStrategy("All Strategies");
    setSelectedContentType("All Types");
    setSortBy("lastUpdated");
  };

  // Filter and sort content items
  const filteredItems = mockContentItems.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStrategy = selectedStrategy === "All Strategies" || item.strategy === selectedStrategy;
    
    return matchesSearch && matchesStrategy;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "lastUpdated":
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      case "expirationDate":
        // Mock sort by expiration (you'd implement actual expiration logic)
        return a.duration.localeCompare(b.duration);
      case "relevance":
        // Mock relevance sort (you'd implement actual relevance scoring)
        return a.question.length - b.question.length;
      default:
        return 0;
    }
  });

  const activeFilters = [];
  if (searchQuery) activeFilters.push({ type: "search", value: searchQuery });
  if (selectedStrategy !== "All Strategies") activeFilters.push({ type: "strategy", value: selectedStrategy });
  if (selectedContentType !== "All Types") activeFilters.push({ type: "contentType", value: selectedContentType });

  const handleExport = (format: string) => {
    // Mock export functionality - in real app would implement actual export
    console.log(`Exporting ${sortedItems.length} items as ${format}`);
  };

  if (selectedFile) {
    return (
      <div className="min-h-screen bg-background flex">
        <AppSidebar />
        <div className="flex-1 ml-64">
          <SingleFileView 
            fileName={selectedFile}
            questionCount={2}
            onBack={handleBackFromFile}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-vault-header border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-vault-header-foreground">Vault</h1>
            
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    AI Actions
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border z-50">
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    <div>
                      <div className="font-medium">Find Duplicates</div>
                      <div className="text-xs text-muted-foreground">Find duplicate questions across documents</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Building className="h-4 w-4 mr-2" />
                    <div>
                      <div className="font-medium">Edit Firm Details</div>
                      <div className="text-xs text-muted-foreground">Update firm information in all documents</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Tag className="h-4 w-4 mr-2" />
                    <div>
                      <div className="font-medium">Update Tags</div>
                      <div className="text-xs text-muted-foreground">Batch update document tags</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 space-y-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions and answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters and Controls */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Strategy" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-50">
                    {strategies.map(strategy => (
                      <SelectItem key={strategy} value={strategy}>{strategy}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Content Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-50">
                    {contentTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-50">
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border z-50">
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('word')}>
                      Export as Word
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Active Filters and Results Count */}
            {(activeFilters.length > 0 || sortedItems.length > 0) && (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {activeFilters.length > 0 && (
                    <>
                      {activeFilters.map((filter, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {filter.type === "search" && "Search: "}
                          {filter.type === "strategy" && "Strategy: "}
                          {filter.type === "contentType" && "Type: "}
                          {filter.value}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => {
                              if (filter.type === "search") setSearchQuery("");
                              if (filter.type === "strategy") setSelectedStrategy("All Strategies");
                              if (filter.type === "contentType") setSelectedContentType("All Types");
                            }}
                          />
                        </Badge>
                      ))}
                      <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                        Clear all
                      </Button>
                    </>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {sortedItems.length} {sortedItems.length === 1 ? 'result' : 'results'}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {sortedItems.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search query or filters to find what you're looking for.
                </p>
              </div>
            ) : (
              sortedItems.map((item) => (
                <QuestionCard 
                  key={item.id} 
                  data={item}
                  onEdit={handleEditQuestion}
                />
              ))
            )}
          </div>
        </main>

        {/* Edit Sheet */}
        {editingQuestion && (
          <QuestionSheet
            data={editingQuestion}
            open={!!editingQuestion}
            onOpenChange={(open) => !open && setEditingQuestion(null)}
          />
        )}
      </div>
    </div>
  );
}
