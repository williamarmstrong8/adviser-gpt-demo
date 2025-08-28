import { useState } from "react";
import { Search, Upload, FileText, Edit3, Copy, Building, Tag, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { VaultTabs } from "./VaultTabs";
import { SearchResults } from "./SearchResults";
import { SingleFileView } from "./SingleFileView";
import { AppSidebar } from "./AppSidebar";

export function VaultLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [selectedTypes, setSelectedTypes] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    }
  };

  const handleBackToFiles = () => {
    setShowSearchResults(false);
    // Keep the search query in the input
  };

  const handleFileClick = (fileName: string) => {
    setSelectedFile(fileName);
  };

  const handleBackFromFile = () => {
    setSelectedFile(null);
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

  if (showSearchResults) {
    return (
      <div className="min-h-screen bg-background flex">
        <AppSidebar />
        <div className="flex-1 ml-64">
          <SearchResults 
            searchQuery={searchQuery}
            onBackToFiles={handleBackToFiles}
            strategy={selectedStrategy}
            types={selectedTypes}
            tags={selectedTags}
            status={selectedStatus}
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
                <DropdownMenuContent align="end" className="w-56">
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

          {/* Search Bar */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions and answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <VaultTabs onFileClick={handleFileClick} />
        </main>
      </div>
    </div>
  );
}
