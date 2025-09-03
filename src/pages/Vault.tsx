import { useSearchParams } from "react-router-dom";
import { VaultHomepage } from "@/components/VaultHomepage";
import { VaultSearchResults } from "@/components/VaultSearchResults";

export default function Vault() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query');

  // If there's a search query, show search results; otherwise show homepage
  return query ? <VaultSearchResults /> : <VaultHomepage />;
}