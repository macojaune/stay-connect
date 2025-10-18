import { useState } from 'react'
import TimelineSectionComponent from '~/components/TimelineSection'
import NewsCard from '~/components/NewsCard'

export interface NewsItem {
  id: string
  title: string
  slug: string
  artist: string
  date: string
  type: string
  category: string
  imageUrl?: string
  featuredArtists: string[]
}

export interface TimelineSection {
  title: string
  subtitle?: string
  news: NewsItem[]
  isUpcoming?: boolean
}

export interface TimelineProps {
  sections?: TimelineSection[]
}

interface GroupedByDay {
  [day: string]: NewsItem[]
}

export default function Timeline({ sections = [] }: TimelineProps) {
  const hasCurrentWeekSection = sections.some((section) => section.title === 'Cette semaine')
  // Helper function to group news by day
  const groupNewsByDay = (news: NewsItem[]): GroupedByDay => {
    const grouped: GroupedByDay = {}
    news.forEach((item) => {
      // Extract day from date string (assuming format like "Aujourd'hui", "Hier", "Il y a X jours")
      const day = item.date
      if (!grouped[day]) {
        grouped[day] = []
      }
      grouped[day].push(item)
    })
    return grouped
  }

  // Helper function to get day order for sorting
  const getDayOrder = (day: string): number => {
    if (day === "Aujourd'hui") return 0
    if (day === 'Hier') return 1
    if (day === 'Demain') return -1
    if (day.startsWith('Il y a')) {
      const match = day.match(/Il y a (\d+)/)
      return match ? parseInt(match[1]) + 1 : 999
    }
    if (day.startsWith('Dans')) {
      const match = day.match(/Dans (\d+)/)
      return match ? -(parseInt(match[1]) + 1) : -999
    }
    return 999
  }

  if (sections.length === 0) {
    return (
      <div className="md:max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Aucune sortie à afficher pour le moment.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="md:max-w-4xl mx-auto px-4 md:px-6">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-0 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand/30 via-brand to-brand/30"></div>

        {sections.map((section, sectionIndex) => {
          const isCurrentWeek = section.title === 'Cette semaine'
          const isPreviousWeek =
            section.title.includes('semaine passée') || section.title.includes('Il y a')
          const isOtherSection = !isCurrentWeek && !section.isUpcoming

          return (
            <TimelineSectionComponent
              key={sectionIndex}
              section={section}
              sectionIndex={sectionIndex}
              isCurrentWeek={isCurrentWeek}
              isPreviousWeek={isPreviousWeek}
              isOtherSection={isOtherSection}
              groupNewsByDay={groupNewsByDay}
              getDayOrder={getDayOrder}
            />
          )
        })}

        {!hasCurrentWeekSection && (
          <div className="relative mb-4 md:mb-8 transition-opacity duration-300">
            <div className="absolute -left-2 md:left-6 w-4 h-4 mt-2 rounded-full border-4 border-white shadow-lg z-10 bg-brand" />
            <div className="ml-4 md:ml-16">
              <div className="mb-2">
                <h3 className="text-2xl font-bold text-gray-900">Cette semaine</h3>
                <p className="text-sm text-gray-600">Les sorties de la semaine</p>
              </div>
              <div className="bg-white border border-dashed border-gray-300 rounded-lg px-4 py-6 text-center text-gray-500">
                Pas encore de sortie répertoriée cette semaine.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
