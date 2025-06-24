import NewsCard from './NewsCard'
import { useState } from 'react'

interface NewsItem {
  id: string
  title: string
  artist: string
  date: string
  type: string // single, album, event
  category: string // genre or event type
  imageUrl?: string
}

interface TimelineSection {
  title: string
  subtitle?: string
  news: NewsItem[]
  isUpcoming?: boolean
}


// Mock data for timeline
const sections: TimelineSection[] = [
  {
    title: "La semaine prochaine",
    subtitle: "À venir",
    isUpcoming: true,
    news: [
      {
        id: "1",
        title: "Nouveau single feat. Damso",
        artist: "Kalash",
        date: "Vendredi 31 janvier",
        type: "single",
        category: "Rap",
        imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400"
      }
    ]
  },
  {
    title: "Aujourd'hui",
    subtitle: "Les sorties du jour",
    news: [
      {
        id: "2",
        title: "Gwada Vibes",
        artist: "Admiral T",
        date: "Aujourd'hui 14h30",
        type: "album",
        category: "Dancehall",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400"
      },
      {
        id: "3",
        title: "Concert à l'Atrium",
        artist: "Shado Chris",
        date: "Aujourd'hui 11h15",
        type: "event",
        category: "Concert",
        imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=400"
      },
      {
        id: "4",
        title: "Soleil Levant",
        artist: "Tiwony",
        date: "Aujourd'hui 9h00",
        type: "single",
        category: "Reggae",
        imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400"
      },
      {
        id: "5",
        title: "Carib Sound Label",
        artist: "Divers Artistes",
        date: "Aujourd'hui 8h45",
        type: "event",
        category: "Business",
        imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=400"
      }
    ]
  },
  {
    title: "La semaine passée",
    subtitle: "Retour sur les temps forts",
    news: [
      {
        id: "6",
        title: "45 ans de Kassav'",
        artist: "Kassav'",
        date: "Il y a 3 jours",
        type: "event",
        category: "Zouk",
        imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=400"
      },
    ]
  }
]

export default function Timeline() {
  const [showMoreToday, setShowMoreToday] = useState(false)

  return (
    <div className="max-w-4xl mx-auto px-6">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand/30 via-brand to-brand/30"></div>

        {sections.map((section, sectionIndex) => {
          const isToday = section.title === "Aujourd'hui"
          const isOtherSection = !isToday
          const todayNewsToShow = isToday && !showMoreToday ? section.news.slice(0, 3) : section.news

          return (
            <div key={sectionIndex} className={`relative mb-8 transition-opacity duration-300`}>
              {/* Timeline dot */}
              <div className={`absolute left-6 w-4 h-4 mt-2 rounded-full border-4 border-white shadow-lg z-10 bg-brand`} />

              {/* Section content */}
              <div className="ml-16">
                <div className="mb-2">
                  <h3 className={`text-2xl font-bold ${isOtherSection ? 'text-gray-500' : 'text-gray-900'
                    }`}>
                    {section.title}
                  </h3>
                  {section.subtitle && (
                    <p className={`text-sm ${isOtherSection ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      {section.subtitle}
                    </p>
                  )}
                </div>

                {/* News list */}
                <div className="space-y-2">
                  {todayNewsToShow.map((newsItem) => (
                    <NewsCard
                      key={newsItem.id}
                      title={newsItem.title}
                      artist={newsItem.artist}
                      date={newsItem.date}
                      type={newsItem.type}
                      category={newsItem.category}
                      imageUrl={newsItem.imageUrl}
                      isUpcoming={section.isUpcoming}
                    />
                  ))}
                </div>

                {/* Show more button for today section */}
                {isToday && !showMoreToday && section.news.length > 3 && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setShowMoreToday(true)}
                      className="px-4 py-2 text-sm font-medium text-brand bg-brand/10 hover:bg-brand/20 rounded-full transition-colors duration-200 flex items-center gap-2"
                    >
                      Voir plus
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}