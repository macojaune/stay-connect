defmodule StayConnect.Artist do
  require Logger
  alias StayConnect.Repo
  alias StayConnect.Artist
  alias StayConnect.ArtistCategory
  alias StayConnect.Category
  alias StayConnect.Feature
  alias StayConnect.Release
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  schema "artists" do
    field :name, :string
    field :description, :string
    field :socials, {:array, :string}

    many_to_many :categories, Category, join_through: ArtistCategory
    has_many :releases, Release
    many_to_many :featured, Release, join_through: Feature

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(artist, attrs) do
    artist
    |> cast(attrs, [:name])
    |> validate_required([:name])
  end

  @doc """
  Retrieves an artist by their ID.

  ## Parameters

    * `id` - The ID of the artist to retrieve.

  ## Returns

    * The `Artist` struct if found.
    * `nil` if no artist with the given ID exists.

  """
  def get(id) do
    Repo.get(Artist, id)
  end

  def searchByName(query) do
    from(a in Artist,
      where: like(a.name, ^"#{query}%"),
      order_by: [asc: :name]
    )
    |> Repo.all()
  end
end
