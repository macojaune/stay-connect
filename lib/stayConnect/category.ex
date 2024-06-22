defmodule StayConnect.Category do
  alias StayConnect.ArtistCategory
  alias StayConnect.Release
  alias StayConnect.Artist
  use Ecto.Schema
  import Ecto.Changeset

  schema "categories" do
    field :description, :string
    field :title, :string
    many_to_many :artists, Artist, join_through: ArtistCategory
    many_to_many :releases, Release, join_through: "releases_categories"
    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(category, attrs) do
    category
    |> cast(attrs, [:title, :description])
    |> validate_required([:title, :description])
  end
end
