import { Copy, Mail, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  onEdit?: (data: QuestionCardData) => void;
}

export function QuestionCard({ data, hideFileName = false, onEdit }: QuestionCardProps) {
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

  const handleEmailAnswer = () => {
    const subject = encodeURIComponent(`Question: ${data.question}`);
    const body = encodeURIComponent(`Question: ${data.question}\n\nAnswer: ${data.answer}\n\nFile: ${data.fileName}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleEdit = () => {
    onEdit?.(data);
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

      {/* Answer with hover actions */}
      <div className="relative group/answer">
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="text-base text-foreground leading-relaxed mb-4 cursor-pointer transition-colors hover:bg-muted/50 -mx-2 px-2 py-2 rounded-md"
              onClick={handleCopyAnswer}
            >
              {data.answer}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" align="start">
            <p>Click to copy answer</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Floating action bar - appears on hover */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover/answer:opacity-100 transition-all duration-200 pointer-events-none group-hover/answer:pointer-events-auto">
          <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleCopyAnswer}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy answer</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleEmailAnswer}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Email answer</p>
              </TooltipContent>
            </Tooltip>
            {onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleEdit}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit question</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}