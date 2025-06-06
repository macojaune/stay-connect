defmodule StayConnect.ReleaseCategory do
  use Ecto.Schema
  import Ecto.Changeset
  alias StayConnect.{Release, Category}

  schema "releases_categories" do
    belongs_to :release, Release
    belongs_to :category, Category

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(release_category, attrs) do
    release_category
    |> cast(attrs, [:release_id, :category_id])
    |> validate_required([:release_id, :category_id])
    |> unique_constraint([:release_id, :category_id])
  end

end
