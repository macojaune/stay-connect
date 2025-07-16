import React, { useMemo } from 'react'
import NewsCard from '~/components/NewsCard'

import { useState } from 'react'
import type { NewsItem, TimelineSection } from '~/components/Timeline'
import { cn } from '~/lib/utils'

interface TimelineSectionProps {
  section: TimelineSection
  sectionIndex: number
  isCurrentWeek: boolean
  isPreviousWeek: boolean
  isOtherSection: boolean
  groupNewsByDay: (news: NewsItem[]) => { [key: string]: NewsItem[] }
  getDayOrder: (day: string) => number
}
const TimelineSection: React.FC<TimelineSectionProps> = ({
  section,
  sectionIndex,
  isCurrentWeek,
  isPreviousWeek,
  isOtherSection,
  groupNewsByDay,
  getDayOrder,
}) => {
  const [showMore, toggleMore] = useState(false)
  console.log(showMore + ' showMore')
  const newsToShow = useMemo(() => {
    if (showMore) {
      return section.news
    }
    return section.news.slice(0, 2)
  }, [showMore, section.news])

  // For current week, group by day
  if (isCurrentWeek && section.news.length > 0) {
    const groupedByDay = groupNewsByDay(section.news)
    const sortedDays = Object.keys(groupedByDay).sort((a, b) => getDayOrder(a) - getDayOrder(b))

    return (
      <div key={sectionIndex} className={`relative mb-4 md:mb-8 transition-opacity duration-300`}>
        {/* Timeline dot */}
        <div
          className={`absolute -left-2 md:left-6 w-4 h-4 mt-2 rounded-full border-4 border-white shadow-lg z-10 bg-brand`}
        />

        {/* Section content */}
        <div className="ml-4 md:ml-16">
          <div className="mb-2">
            <h3 className="text-2xl font-bold text-gray-900">{section.title}</h3>
            {section.subtitle && <p className="text-sm text-gray-600">{section.subtitle}</p>}
          </div>

          {/* Group by day for current week */}
          <div className="space-y-4">
            {sortedDays.map((day) => (
              <div key={day} className="space-y-2">
                <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-1">
                  {day}
                </h4>
                <div className="space-y-2 ml-4">
                  {groupedByDay[day].map((newsItem) => (
                    <NewsCard key={newsItem.id} item={newsItem} isUpcoming={section?.isUpcoming} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // For previous weeks, show only 2 releases with show more button
  if (isPreviousWeek) {
    return (
      <div key={sectionIndex} className={`relative mb-4 md:mb-8 transition-opacity duration-300`}>
        {/* Timeline dot */}
        <div
          className={`absolute -left-2 md:left-6 w-4 h-4 mt-2 rounded-full border-4 border-white shadow-lg z-10 bg-brand`}
        />

        {/* Section content */}
        <div className="ml-4 md:ml-16">
          <div className="mb-2">
            <h3 className="text-2xl font-bold text-gray-500">{section.title}</h3>
            {section.subtitle && <p className="text-sm text-gray-400">{section.subtitle}</p>}
          </div>

          {/* News list */}
          <div className="space-y-2">
            {newsToShow.length > 0 ? (
              newsToShow.map((newsItem) => (
                <NewsCard key={newsItem.id} item={newsItem} isUpcoming={section.isUpcoming} />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 opacity-35 w-full">
                <div className="flex items-center p-2 gap-4">
                  <div className="w-16 h-16 aspect-square bg-gray-200 rounded-md overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-brand/20 to-brand/40 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-brand/60"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  {/* Title and Artist */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <div className="w-16 h-4 bg-gray-900/50  rounded-md" />
                      <div
                        className={`w-24 h-4 px-2 py-1 font-medium rounded-md bg-gray-500/50  
                          `}
                      />
                    </div>
                    <div
                      className={`w-12 h-4 px-2 py-1 font-medium rounded-full bg-brand/10  
                          `}
                    />
                  </div>

                  <div className="flex flex-col gap-1 items-end">
                    <div className="w-16 h-5 rounded-full bg-brand/10 " />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Show more button for previous weeks */}
          {section.news.length > 2 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => toggleMore((prev) => !prev)}
                className="px-4 py-2 text-sm font-medium text-brand bg-brand/10 hover:bg-brand/20 rounded-full transition-colors duration-200 flex items-center gap-2"
              >
                {showMore ? 'Voir moins' : `Voir plus (${section.news.length - 2} autres)`}
                <svg
                  className={`w-4 h-4 ${showMore ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // For other sections (upcoming, etc.), keep original behavior
  return (
    <div key={sectionIndex} className={`relative mb-4 md:mb-8 transition-opacity duration-300`}>
      {/* Timeline dot */}
      <div
        className={`absolute -left-2 md:left-6 w-4 h-4 mt-2 rounded-full border-4 border-white shadow-lg z-10 bg-brand`}
      />

      {/* Section content */}
      <div className="ml-4 md:ml-16">
        <div className="mb-2">
          <h3
            className={`text-2xl font-bold ${isOtherSection ? 'text-gray-500' : 'text-gray-900'}`}
          >
            {section.title}
          </h3>
          {section.subtitle && (
            <p className={`text-sm ${isOtherSection ? 'text-gray-400' : 'text-gray-600'}`}>
              {section.subtitle}
            </p>
          )}
        </div>

        {/* News list */}
        <div className="space-y-2">
          {newsToShow.length > 0 ? (
            newsToShow.map((newsItem) => (
              <NewsCard key={newsItem.id} item={newsItem} isUpcoming={section.isUpcoming} />
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 opacity-35 w-full">
              <div className="flex items-center p-2 gap-4">
                <div className="w-16 h-16 aspect-square bg-gray-200 rounded-md overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-brand/20 to-brand/40 flex items-center justify-center">
                    <svg className="w-6 h-6 text-brand/60" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                {/* Title and Artist */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="w-16 h-4 bg-gray-900/50  rounded-md" />
                    <div
                      className={`w-24 h-4 px-2 py-1 font-medium rounded-md bg-gray-500/50  
                        `}
                    />
                  </div>
                  <div
                    className={`w-12 h-4 px-2 py-1 font-medium rounded-full bg-brand/10  
                        `}
                  />
                </div>

                <div className="flex flex-col gap-1 items-end">
                  <div className="w-16 h-5 rounded-full bg-brand/10 " />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Show more button for today section */}
        {section.title === "Aujourd'hui" && section.news.length > 3 && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => toggleMore((prev) => !prev)}
              className="px-4 py-2 text-sm font-medium text-brand bg-brand/10 hover:bg-brand/20 rounded-full transition-colors duration-200 flex items-center gap-2"
            >
              {showMore ? 'Voir moins' : `Voir plus`}
              <svg
                className={cn('w-4 h-4', { 'rotate-180': showMore })}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TimelineSection
