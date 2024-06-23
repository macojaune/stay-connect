# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     StayConnect.Repo.insert!(%StayConnect.SomeSchema{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.

alias StayConnect.Repo
alias StayConnect.{Category, Artist, Release}

# # Insert artists
artists =
  [
    %Artist{name: "Kenzy"},
    %Artist{name: "Larose"},
    %Artist{name: "Latop"}
  ]

#   |> Enum.map(&Repo.insert!(&1))

# # Insert releases
releases =
  [
    %Release{title: "Release One"},
    %Release{title: "Release Two"},
    %Release{title: "Release Three"}
  ]

#   |> Enum.map(&Repo.insert!(&1))

# Insert categories
categories =
  [
    %Category{
      title: "Rap",
      description: "Ça kick et ça tabasse.",
      artists: [Enum.at(artists, 0), Enum.at(artists, 1)],
      releases: [Enum.at(releases, 0), Enum.at(releases, 1)]
    },
    %Category{
      title: "Drill",
      description: "big 808, big kichta",
      artists: [Enum.at(artists, 1), Enum.at(artists, 2)],
      releases: [Enum.at(releases, 1), Enum.at(releases, 2)]
    },
    %Category{
      title: "Dancehall",
      description: "Jamaica to di world.",
      artists: [Enum.at(artists, 0), Enum.at(artists, 2)],
      releases: [Enum.at(releases, 0), Enum.at(releases, 2)]
    }
  ]
  |> Enum.each(&Repo.insert!(&1))

IO.puts("Seeding completed successfully!")
