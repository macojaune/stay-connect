defmodule StayConnect.Release do
  alias StayConnect.Release
  alias StayConnect.Repo
  alias StayConnect.Vote
  alias StayConnect.Feature
  alias StayConnect.Category
  alias StayConnect.Artist
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  schema "releases" do
    field :description, :string
    field :title, :string
    field :date, :utc_datetime
    # single, album, video
    field :type, :string
    field :urls, {:array, :string}
    field :cover, :string
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

  @doc """
  Get today's releases
  """
  def list_today() do
    today = Date.utc_today()
    start_of_day = DateTime.new!(today, ~T[00:00:00], "Etc/UTC")
    end_of_day = DateTime.new!(today, ~T[23:59:59], "Etc/UTC")

    from(r in Release,
      where: r.date >= ^start_of_day and r.date <= ^end_of_day,
      preload: [:artist, :categories, :featuring]
    )
    |> Repo.all()
  end

  def list_weekly() do
    from(r in Release,
      preload: [:artist, :categories, :featuring],
      group_by: fragment("strftime('%Y-%W', ?)", r.date)
    )
    |> Repo.all()
  end
end
