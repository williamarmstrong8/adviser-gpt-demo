import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">AdvisorGPT Vault</h1>
        <p className="text-lg text-muted-foreground">
          Manage and search your investment documents and Q&A content
        </p>
        <Link to="/vault">
          <Button size="lg" className="bg-black text-white hover:bg-black/90">
            Enter Vault
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
