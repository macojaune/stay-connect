import { Head } from '@inertiajs/react'
import AppLayout from '../layouts/AppLayout'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { PageProps } from '../types'

interface HomeProps extends PageProps {
  featuredArtists?: any[]
  featuredReleases?: any[]
  stats?: {
    totalArtists: number
    totalReleases: number
    totalVotes: number
  }
}

export default function Home({ auth, featuredArtists = [], featuredReleases = [], stats }: HomeProps) {
  return (
    <AppLayout>
      <Head title="StayConnect - Discover Amazing Music" />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 text-balance">
              Discover Your Next
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Favorite Artist
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto text-balance">
              Connect with emerging artists, discover new releases, and help shape the future of music through community-driven discovery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
                Start Discovering
              </Button>
              {!auth?.user && (
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-700">
                  Join the Community
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="py-16 bg-secondary-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {stats.totalArtists.toLocaleString()}
                </div>
                <div className="text-secondary-600 font-medium">Artists Discovered</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {stats.totalReleases.toLocaleString()}
                </div>
                <div className="text-secondary-600 font-medium">Releases Featured</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {stats.totalVotes.toLocaleString()}
                </div>
                <div className="text-secondary-600 font-medium">Community Votes</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Artists Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-secondary-900 mb-4">
              Featured Artists
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Discover talented artists that are making waves in the music industry
            </p>
          </div>
          
          {featuredArtists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {featuredArtists.slice(0, 6).map((artist, index) => (
                <Card key={artist.id || index} className="hover:shadow-medium transition-shadow duration-300">
                  <CardHeader>
                    <div className="w-full h-48 bg-secondary-200 rounded-lg mb-4 flex items-center justify-center">
                      {artist.imageUrl ? (
                        <img 
                          src={artist.imageUrl} 
                          alt={artist.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-secondary-400 text-4xl">🎵</div>
                      )}
                    </div>
                    <CardTitle className="text-xl">{artist.name || `Artist ${index + 1}`}</CardTitle>
                    <CardDescription>
                      {artist.genres?.join(', ') || 'Various Genres'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-secondary-600">
                        ⭐ {artist.averageRating?.toFixed(1) || '4.5'} ({artist.totalVotes || '12'} votes)
                      </div>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((index) => (
                <Card key={index} className="hover:shadow-medium transition-shadow duration-300">
                  <CardHeader>
                    <div className="w-full h-48 bg-secondary-200 rounded-lg mb-4 flex items-center justify-center">
                      <div className="text-secondary-400 text-4xl">🎵</div>
                    </div>
                    <CardTitle className="text-xl">Featured Artist {index}</CardTitle>
                    <CardDescription>Indie Rock, Alternative</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-secondary-600">
                        ⭐ 4.{index + 2} (1{index}2 votes)
                      </div>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="text-center">
            <Button variant="outline" size="lg">
              View All Artists
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Releases Section */}
      <section className="py-16 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-secondary-900 mb-4">
              Latest Releases
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Fresh music from artists you should know about
            </p>
          </div>
          
          {featuredReleases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {featuredReleases.slice(0, 4).map((release, index) => (
                <Card key={release.id || index} className="hover:shadow-medium transition-shadow duration-300">
                  <CardHeader>
                    <div className="w-full h-48 bg-secondary-200 rounded-lg mb-4 flex items-center justify-center">
                      {release.coverImageUrl ? (
                        <img 
                          src={release.coverImageUrl} 
                          alt={release.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-secondary-400 text-4xl">💿</div>
                      )}
                    </div>
                    <CardTitle className="text-lg">{release.title || `Release ${index + 1}`}</CardTitle>
                    <CardDescription>
                      {release.artist?.name || `Artist ${index + 1}`} • {release.type || 'Album'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-secondary-600">
                        ⭐ {release.averageRating?.toFixed(1) || '4.3'}
                      </div>
                      <Button variant="outline" size="sm">
                        Listen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((index) => (
                <Card key={index} className="hover:shadow-medium transition-shadow duration-300">
                  <CardHeader>
                    <div className="w-full h-48 bg-secondary-200 rounded-lg mb-4 flex items-center justify-center">
                      <div className="text-secondary-400 text-4xl">💿</div>
                    </div>
                    <CardTitle className="text-lg">New Release {index}</CardTitle>
                    <CardDescription>Artist Name • Album</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-secondary-600">
                        ⭐ 4.{index + 1}
                      </div>
                      <Button variant="outline" size="sm">
                        Listen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="text-center">
            <Button variant="outline" size="lg">
              View All Releases
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Ready to Discover Amazing Music?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join our community of music lovers and help emerging artists get the recognition they deserve.
          </p>
          {!auth?.user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
                Sign Up Now
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-700">
                Learn More
              </Button>
            </div>
          ) : (
            <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
              Explore More Music
            </Button>
          )}
        </div>
      </section>

    </AppLayout>)
}