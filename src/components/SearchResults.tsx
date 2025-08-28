import { useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionCard, QuestionCardData } from "./QuestionCard";
import { QuestionSheet } from "./QuestionSheet";

interface SearchResultsProps {
  searchQuery: string;
  onBackToFiles: () => void;
  strategy?: string;
  types?: string;
  tags?: string;
  status?: string;
}

const mockResults = [
  {
    id: "1",
    fileName: "AI_Policy_Document_April_2025",
    updatedAt: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000), // 2 months ago
    updatedBy: "Brian",
    question: "What specific approval process must Granite Peak employees follow before implementing AI systems like ChatGPT or CoPilot, and what limitations are currently placed on their use for client-facing business purposes?",
    answer: "Granite Peak maintains an Acceptable Use of Artificial Intelligence (\"AI\") Systems Policy (below). The use of artificial intelligence and natural language processing programs and related software i.e., ChatGPT, CoPilot, Bard, and others by the Firm and its employees must comply with all applicable laws, regulations, and the ethical principles outlined in this Compliance Manual and the Firm's Code of Ethics, including those related to the protection of sensitive firm and client information outlined in the Firm's Cybersecurity and Information Security Policy. Before formally implementing any such software, employees must first obtain approval from the Deputy Chief Compliance Officer and Director of Operations. At this time, use of this software is limited to testing only and should not be used for any client facing business.",
    duration: "Evergreen",
    strategy: "Firm Wide (Not Strategy Specific)",
    tags: ["AI", "IT"]
  },
  {
    id: "2",
    fileName: "Question Vault",
    updatedAt: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000), // 3 months ago
    updatedBy: "Mary",
    question: "What specific measures does Granite Peak implement to ensure compliance with the Books and Records Rule regarding the use of AI systems, and what are the implications of the policy that prohibits the use of AI Systems for business purposes at this time?",
    answer: "Granite Peak implements comprehensive measures to ensure compliance with the Books and Records Rule regarding AI systems usage. The firm maintains detailed documentation of all AI system evaluations, testing procedures, and approval processes through the Deputy Chief Compliance Officer and Director of Operations.",
    duration: "Evergreen",
    strategy: "Firm Wide (Not Strategy Specific)",
    tags: ["AI", "IT"]
  }
];

export function SearchResults({ searchQuery, onBackToFiles }: SearchResultsProps) {
  const [searchWithinResults, setSearchWithinResults] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<QuestionCardData | null>(null);

  const handleEditQuestion = (questionData: QuestionCardData) => {
    setEditingQuestion(questionData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={onBackToFiles} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Files
          </Button>
        </div>

        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground mb-2">"{searchQuery}"</h1>
          <p className="text-muted-foreground">
            {mockResults.length} questions found
          </p>
        </div>

        {/* Search within results */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search within results..."
            value={searchWithinResults}
            onChange={(e) => setSearchWithinResults(e.target.value)}
            className="pl-10"
          />
        </div>
      </header>

      {/* Results */}
      <main className="py-6">
        <div className="max-w-4xl mx-auto">
          {mockResults.map((result) => (
            <QuestionCard 
              key={result.id} 
              data={result} 
              onEdit={handleEditQuestion}
            />
          ))}
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
  );
}