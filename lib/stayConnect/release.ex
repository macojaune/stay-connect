defmodule StayConnect.Release do
  alias StayConnect.Vote
  alias StayConnect.Feature
  alias StayConnect.Category
  alias StayConnect.Artist
  use Ecto.Schema
  import Ecto.Changeset

  schema "releases" do
    field :description, :string
    field :title, :string
    field :date, :utc_datetime
    # single, album, video
    field :type, :string
    field :urls, {:array, :string}
    has_many :votes, Vote
    many_to_many :categories, Category, join_through: "releases_categories"
    belongs_to :artist, Artist
    many_to_many :featuring, Artist, join_through: Feature

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(release, attrs) do
    release
    |> cast(attrs, [:title, :description, :date, :type, :categories, :artist])
    |> validate_required([:title, :description, :date, :type, :categories, :artist])
  end
end
