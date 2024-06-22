defmodule StayConnect.Artist do
  alias StayConnect.ArtistCategory
  alias StayConnect.Category
  alias StayConnect.Feature
  alias StayConnect.Release
  use Ecto.Schema
  import Ecto.Changeset

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
end
