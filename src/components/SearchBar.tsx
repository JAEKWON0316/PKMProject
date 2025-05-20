import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

type SearchBarProps = {
  onSearch: (query: string) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  return (
    <div className="relative mb-4 max-w-md mx-auto">
      <Input
        type="text"
        placeholder="대화 검색..."
        className="w-full h-10 pl-10 pr-4 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
        onChange={(e) => onSearch(e.target.value)}
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
    </div>
  )
}
