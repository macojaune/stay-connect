defmodule StayConnect.Feature do
  alias StayConnect.Artist
  alias StayConnect.Release
  use Ecto.Schema
  import Ecto.Changeset

  schema "features" do
    belongs_to :release, Release
    belongs_to :artist, Artist

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(feature, attrs) do
    feature
    |> cast(attrs, [])
    |> validate_required([])
  end
end
