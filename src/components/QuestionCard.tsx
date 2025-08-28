import { Copy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export interface QuestionCardData {
  id: string;
  fileName: string;
  updatedAt: Date;
  updatedBy: string;
  question: string;
  answer: string;
  duration: string;
  strategy: string;
  tags: string[];
}

interface QuestionCardProps {
  data: QuestionCardData;
  hideFileName?: boolean;
}

export function QuestionCard({ data, hideFileName = false }: QuestionCardProps) {
  const { toast } = useToast();

  const handleCopyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(data.answer);
      toast({
        title: "Copied!",
        description: "Answer copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy answer",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="group px-6 py-6 border-b border-border last:border-0">
      {/* Question */}
      <h3 className="text-lg font-semibold text-foreground leading-tight mb-3">
        {data.question}
      </h3>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(data.updatedAt, { addSuffix: true })} by {data.updatedBy}
        </span>
        {data.tags && data.tags.length > 0 && (
          <div className="flex gap-2">
            {data.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {data.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{data.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
      
      {!hideFileName && (
        <p className="text-sm text-muted-foreground mb-4">
          {data.fileName}
        </p>
      )}

      {/* Answer with copy button */}
      <div className="relative">
        <p className="text-base text-foreground leading-relaxed pr-20 mb-4">
          {data.answer}
        </p>
        <Button
          onClick={handleCopyAnswer}
          variant="outline"
          className="absolute top-0 right-0 h-9 px-4"
          title="Copy answer"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
      </div>
    </div>
  );
}