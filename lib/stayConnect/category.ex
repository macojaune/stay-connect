defmodule StayConnect.Category do
  alias StayConnect.Repo
  alias StayConnect.{ArtistCategory, Release, Artist, Category, ReleaseCategory}

  use Ecto.Schema
  import Ecto.{Query, Changeset}

  schema "categories" do
    field :description, :string
    field :name, :string
    
    many_to_many :artists, Artist, join_through: ArtistCategory
    many_to_many :releases, Release, join_through: ReleaseCategory, on_replace: :delete

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(category, attrs) do
    category
    |> cast(attrs, [:name, :description])
    |> validate_required([:name, :description])
  end

  @doc """
  Searches for categories by name.

  ## Parameters

  * `query` - A string to match against the beginning of category names.

  ## Returns

  * A list of `Category` structs whose names start with the given query string.
  * The list is ordered alphabetically by name.
  * Returns an empty list if no matching categories are found.

  ## Examples

  iex> search_by_name("Rock")
  [%Category{name: "Rock", description: "Rock music category"}, %Category{name: "Rock'n'Roll", description: "Rock'n'Roll music category"}]
  """
  def search_by_name(query) do
    from(c in Category,
      where: like(c.name, ^"#{query}%"),
      order_by: [asc: :name]
    )
    |> Repo.all()
  end
end
