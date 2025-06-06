defmodule StayConnect.Release do
  alias StayConnect.{Repo, Release, Vote, Feature, Category, Artist, ReleaseCategory}
  use Ecto.Schema
  import Ecto.{Changeset, Query}
  require Logger

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
    many_to_many :categories, Category, join_through: ReleaseCategory, on_replace: :delete
    belongs_to :artist, Artist
    many_to_many :featurings, Artist, join_through: Feature

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(%Release{} = release, attrs \\ %{}) do
    release
    |> cast(attrs, [
      :title,
      :description,
      :date,
      :type,
      :urls,
      :artist_id,
      :is_secret,
      :is_automated
    ])
    |> validate_required([
      :title,
      :description,
      :date,
      :type,
      :urls,
      :artist_id,
      :is_secret,
      :is_automated
    ])
    |> put_assoc(:categories, attrs["categories"])
    |> put_assoc(:featurings, attrs["featurings"])
    |> assoc_constraint(:artist)
  end

  @doc """
  Get Release by id

  """
  def by_id!(id) do
    Repo.get!(Release, id)
    |> Repo.preload([:artist, :categories, :featurings, :votes])
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
      preload: [:artist, :categories, :featurings, :votes]
    )
    |> Repo.all()
    |> Repo.preload([:artist, :categories, :featurings, :votes])
  end

  def list_weekly() do
    from(r in Release,
      where: r.is_secret == false or r.date <= fragment("strftime('%Y-%m-%d %H:%M:%S', 'now')"),
      preload: [:artist, :categories, :featurings, :votes],
      order_by: [desc: r.date]
    )
    |> Repo.all()
    |> Repo.preload([:artist, :categories, :featurings, :votes])
    |> Enum.group_by(&week_start_date/1)

    # todo limit / pagination ?
  end

  def create(attrs \\ %{}) do
    IO.inspect(attrs, label: "Attributes passed to Release.create")

    result =
      %Release{}
      |> changeset(attrs)
      |> Repo.insert()

    IO.inspect(result, label: "Result of Repo.insert in Release.create")

    case result do
      {:ok, release} ->
        release = Repo.preload(release, [:categories, :featurings])
        {:ok, release}

      error ->
        error
    end
  end

  # Utils
  defp week_start_date(%{date: date}) do
    {year, week} = :calendar.iso_week_number({date.year, date.month, date.day})

    first_day_of_week =
      :calendar.date_to_gregorian_days({year, 1, 4}) + (week - 1) * 7 -
        :calendar.day_of_the_week({year, 1, 4}) + 1

    :calendar.gregorian_days_to_date(first_day_of_week)
  end

  def platform_from_url(url) do
    case url do
      "https://open.spotify.com/" <> _ -> "spotify"
      "https://music.apple.com/" <> _ -> "apple-music"
      "https://deezer.com/" <> _ -> "deezer"
      "https://soundcloud.com/" <> _ -> "soundcloud"
      "https://www.youtube.com/" <> _ -> "youtube"
      _ -> "unknown"
    end
  end
end
