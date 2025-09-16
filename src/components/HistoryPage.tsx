import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Clock, 
  Copy, 
  Trash2, 
  Search, 
  Calendar,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useToast } from "@/hooks/use-toast";
import { VaultSidebar } from "./VaultSidebar";
import { Link } from "react-router-dom";

export function HistoryPage() {
  const navigate = useNavigate();
  const { history, clearHistory, removeFromHistory } = useSearchHistory();
  const { toast } = useToast();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSearchDescription = (historyItem: any) => {
    const parts = [];
    
    if (historyItem.query) {
      parts.push(`"${historyItem.query}"`);
    }
    
    if (historyItem.filters.strategies?.length > 0) {
      parts.push(`Strategies: ${historyItem.filters.strategies.join(", ")}`);
    }
    
    if (historyItem.filters.types?.length > 0) {
      parts.push(`Types: ${historyItem.filters.types.join(", ")}`);
    }
    
    if (historyItem.filters.tags?.length > 0) {
      parts.push(`Tags: ${historyItem.filters.tags.join(", ")}`);
    }
    
    if (historyItem.filters.statuses?.length > 0) {
      parts.push(`Statuses: ${historyItem.filters.statuses.join(", ")}`);
    }
    
    if (historyItem.sort && historyItem.sort !== 'relevance') {
      parts.push(`Sort: ${historyItem.sort}`);
    }
    
    return parts.length > 0 ? parts.join(" • ") : "No filters applied";
  };

  const generateHistoryUrl = (historyItem: any) => {
    const params = new URLSearchParams();
    
    if (historyItem.query) params.set('query', historyItem.query);
    if (historyItem.filters.strategies?.length > 0) params.set('strategy', historyItem.filters.strategies.join(','));
    if (historyItem.filters.types?.length > 0) params.set('type', historyItem.filters.types.join(','));
    if (historyItem.filters.tags?.length > 0) params.set('tags', historyItem.filters.tags.join(','));
    if (historyItem.filters.statuses?.length > 0) params.set('status', historyItem.filters.statuses.join(','));
    if (historyItem.sort && historyItem.sort !== 'relevance') params.set('sort', historyItem.sort);
    
    const queryString = params.toString();
    return queryString ? `/vault?${queryString}` : '/vault';
  };

  const handleRunSearch = (historyItem: any) => {
    const url = generateHistoryUrl(historyItem);
    navigate(url);
  };

  const handleCopyLink = async (historyItem: any) => {
    const url = generateHistoryUrl(historyItem);
    const fullUrl = `${window.location.origin}${url}`;
    
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: "Link copied!",
        description: "The search link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteHistoryItem = (id: string, displayName: string) => {
    removeFromHistory(id);
    toast({
      title: "Search removed",
      description: `"${displayName}" has been removed from your search history.`,
    });
  };

  const handleClearAllHistory = () => {
    clearHistory();
    toast({
      title: "History cleared",
      description: "All search history has been cleared.",
    });
  };

  return (
    <div className="h-screen flex ml-64">
      {/* Sidebar */}
      <VaultSidebar />
      
      {/* Main Content */}
      <div className="flex-1 h-full flex flex-col">
        {/* Header with Breadcrumbs */}
        <div className="border-b bg-background">
          <div className="p-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm mb-6">
              <Link to="/" className="text-muted-foreground hover:text-foreground">
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Link 
                to="/vault" 
                className="text-muted-foreground hover:text-foreground"
              >
                Vault
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground font-medium">
                Search History
              </span>
            </div>

            {/* Title */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Search History
                </h1>
                <p className="text-muted-foreground mt-1">
                  {history.length} recent search{history.length !== 1 ? 'es' : ''}
                </p>
              </div>
              
              {history.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear all search history</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to clear all search history? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearAllHistory}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No search history yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Your recent searches will appear here as you use the vault.
              </p>
              <Button onClick={() => navigate('/vault')}>
                Go to Vault
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {history.map((historyItem) => (
                <Card key={historyItem.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          {historyItem.displayName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatSearchDescription(historyItem)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRunSearch(historyItem)}
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Run Search
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(historyItem)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove from history</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove "{historyItem.displayName}" from your search history?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteHistoryItem(historyItem.id, historyItem.displayName)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Searched {formatDate(historyItem.timestamp)}
                      </div>
                      
                      {historyItem.query && (
                        <div className="flex items-center gap-1">
                          <Search className="h-3 w-3" />
                          Query: "{historyItem.query}"
                        </div>
                      )}
                      
                      {(historyItem.filters.strategies?.length > 0 || 
                        historyItem.filters.types?.length > 0 || 
                        historyItem.filters.tags?.length > 0 || 
                        historyItem.filters.statuses?.length > 0) && (
                        <div className="flex items-center gap-1">
                          <Filter className="h-3 w-3" />
                          {[
                            ...(historyItem.filters.strategies || []),
                            ...(historyItem.filters.types || []),
                            ...(historyItem.filters.tags || []),
                            ...(historyItem.filters.statuses || [])
                          ].length} filter{[
                            ...(historyItem.filters.strategies || []),
                            ...(historyItem.filters.types || []),
                            ...(historyItem.filters.tags || []),
                            ...(historyItem.filters.statuses || [])
                          ].length !== 1 ? 's' : ''}
                        </div>
                      )}
                      
                      {historyItem.sort && historyItem.sort !== 'relevance' && (
                        <div className="flex items-center gap-1">
                          <ArrowUpDown className="h-3 w-3" />
                          Sorted by {historyItem.sort}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
