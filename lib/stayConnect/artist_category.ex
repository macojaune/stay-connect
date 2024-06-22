defmodule StayConnect.ArtistCategory do
  alias StayConnect.Category
  alias StayConnect.Artist
  use Ecto.Schema
  import Ecto.Changeset

  schema "artists_categories" do
    belongs_to :artist, Artist
    belongs_to :category, Category

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(artist_category, attrs) do
    artist_category
    |> cast(attrs, [])
    |> validate_required([])
  end
end
