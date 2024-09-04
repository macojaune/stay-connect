defmodule StayConnect.Release do
  alias StayConnect.{Repo, Release, Vote, Feature, Category, Artist}
  use Ecto.Schema
  import Ecto.{Changeset, Query}

  schema "releases" do
    field :description, :string
    field :title, :string
    field :date, :utc_datetime
    # single, album, video
    field :type, :string
    field :urls, {:array, :string}
    field :cover, :string

    field :is_secret, :boolean, default: false
    field :is_automated, :boolean, default: false
    has_many :votes, Vote
    many_to_many :categories, Category, join_through: "releases_categories"
    belongs_to :artist, Artist
    many_to_many :featuring, Artist, join_through: Feature

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(%Release{} = release, attrs \\ %{}) do
    release
    |> cast(attrs, [:title, :description, :date, :type])
    |> validate_required([:title, :description, :date, :type, :categories, :artist])
  end

  @doc """
  Get Release by id
  
  """
  def by_id!(id) do
    Repo.get!(Release, id)
    |> Repo.preload([:artist, :categories, :featuring, :votes])
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
      preload: [:artist, :categories, :featuring, :votes]
    )
    |> Repo.all()
  end

  def list_weekly() do
    from(r in Release,
      preload: [:artist, :categories, :featuring, :votes],
      order_by: [desc: r.date]
    )
    |> Repo.all()
    |> Enum.group_by(&week_start_date/1)

    # todo limit / pagination ?
  end

  def create(attrs) do
    %Release{}
    |> Release.changeset(attrs)
    |> Repo.insert()
  end

  # Utils
  defp week_start_date(%{date: date}) do
    {year, week} = :calendar.iso_week_number({date.year, date.month, date.day})

    first_day_of_week =
      :calendar.date_to_gregorian_days({year, 1, 4}) + (week - 1) * 7 -
        :calendar.day_of_the_week({year, 1, 4}) + 1

    :calendar.gregorian_days_to_date(first_day_of_week)
  end
end
