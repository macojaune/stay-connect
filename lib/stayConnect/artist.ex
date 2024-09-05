defmodule StayConnect.Artist do
  require Logger
  alias StayConnect.Repo
  alias StayConnect.{Artist, ArtistCategory, Category, Feature, Release}

  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  schema "artists" do
    field :name, :string
    field :description, :string
    field :socials, {:array, :string}

    belongs_to :user, StayConnect.Accounts.User
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

  @doc """
  Searches for artists by name.

  ## Parameters

    * `query` - A string to match against the beginning of artist names.

  ## Returns

    * A list of `Artist` structs whose names start with the given query string.
    * The list is ordered alphabetically by name.
    * Returns an empty list if no matching artists are found.

  ## Examples

      iex> search_by_name("John")
      [%Artist{name: "John Doe"}, %Artist{name: "John Smith"}]

      iex> search_by_name("XYZ")
      []

  """
  def search_by_name(query) do
    from(a in Artist,
      where: like(a.name, ^"#{query}%"),
      order_by: [asc: :name]
    )
    |> Repo.all()
  end


end
