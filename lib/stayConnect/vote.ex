defmodule StayConnect.Vote do
  alias StayConnect.Release
  use Ecto.Schema
  import Ecto.Changeset

  schema "votes" do
    # 1 or -1
    field :vote, :integer
    belongs_to :user, User
    belongs_to :release, Release

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(vote, attrs) do
    vote
    |> cast(attrs, [])
    |> validate_required([])
  end
end
