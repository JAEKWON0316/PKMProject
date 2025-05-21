import { Button } from "@/components/ui/button"

type CategoryFilterProps = {
  categories: string[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
  counts?: Record<string, number>
}

export default function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  counts = {}
}: CategoryFilterProps) {
  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">카테고리</h2>
      <div className="space-y-1">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center ${
              selectedCategory === category
                ? "bg-purple-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <span>{category}</span>
            {counts && (
              <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                {counts[category] || 0}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
