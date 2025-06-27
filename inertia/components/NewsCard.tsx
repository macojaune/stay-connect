import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'

interface NewsCardProps {
  title: string
  artist: string
  date: string
  type: string // single, album, event
  category: string // genre or event type
  imageUrl?: string
  isUpcoming?: boolean
}

export default function NewsCard({
  title,
  artist,
  date,
  type,
  category,
  imageUrl,
  isUpcoming = false,
}: NewsCardProps) {
  return (
    <Tooltip>
      <TooltipTrigger  asChild>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer">
          <div className="flex items-center p-2 gap-4">
            {/* Square Album Cover */}
            <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
              {imageUrl ? (
                <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand/20 to-brand/40 flex items-center justify-center">
                  <svg className="w-6 h-6 text-brand/60" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Title and Artist */}
            <div className="flex-grow min-w-0">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {artist} - <span className="text-sm text-gray-500">{title}</span>
              </h3>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  type === 'single'
                    ? 'bg-green-100 text-green-800'
                    : type === 'album'
                      ? 'bg-purple-100 text-purple-800'
                      : type === 'event'
                        ? 'bg-orange-100 text-orange-800'
                        : isUpcoming
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                }`}
              >
                {type}
              </span>
              {isUpcoming ? <p className="text-xs text-gray-500 mt-1">{date}</p> : null}
            </div>

            {/* Pills for Type and Category */}
            <div className="flex flex-col gap-1 items-end flex-shrink-0">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-brand/10 text-brand">
                {category}
              </span>
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Plus de fonctionnalités à venir !</p>
      </TooltipContent>
    </Tooltip>
  )
}
