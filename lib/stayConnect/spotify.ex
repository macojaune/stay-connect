defmodule StayConnect.Spotify do
  @moduledoc "Interface to talk to Spotify API and fetch data for our usage"
  require Logger
  use Ecto.Schema
  alias StayConnect.{Artist, Category, ArtistCategory, Repo}

    def insert_artist_data(json_data \\ %{}) do
      Enum.map(json_data["items"], &insert_artist(&1))
    end

    defp insert_artist(artist_data) do
      # Create a new artist record
      artist = %Artist{
        name: artist_data["name"],
        description: "Description from API", # You can customize this
        socials: ["https://example.com/"]  # Example, replace with actual social links
      }

      with {:ok, inserted_artist} <- Ecto.insert(Repo, artist) do
        # Handle genres as categories
        Enum.map(artist_data["genres"], &create_category_if_not_exists(&1))

        insert_artist_categories(inserted_artist, artist_data["genres"])

        inserted_artist
      end
    end

    defp insert_artist_categories(%Artist{} = artist, genres) do
      Enum.each(genres, fn genre ->
        with {:ok, category} <- create_category_if_not_exists(genre) do
          # Associate the artist with the category
          %ArtistCategory{artist: artist, category: category}
            |> Ecto.insert(Repo)
        end
      end)
    end

    defp create_category_if_not_exists(name) do
      case Category |> Repo.all() |> Enum.find(&(&1.name == name)) do
        nil ->
          %Category{name: name, description: ""}
            |> Ecto.insert(Repo)

        category ->
          {:ok, category}
      end
    end

    def create_user() do
      # Replace with your actual user creation logic if needed
      %{id: 1, username: "example_user"}
    end
end
