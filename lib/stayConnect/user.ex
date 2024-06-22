defmodule StayConnect.User do
  alias StayConnect.Vote
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :username, :string
    field :email, :string
    field :isLoxymore, :boolean, default: false
    has_many :votes, Vote

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:username, :email, :isLoxymore])
    |> validate_required([:username, :email])
  end
end
