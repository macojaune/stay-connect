defmodule StayConnect.Vote do
  require Logger
  alias StayConnect.{Repo, Release, Vote}
  use Ecto.Schema
  import Ecto.{Changeset, Query}

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
    |> cast(attrs, [:vote, :user_id, :release_id])
    |> validate_required([:vote, :user_id, :release_id])
  end

  def upvote_release(user_id, release_id) do
    create_or_update_vote(user_id, release_id, 1)
  end

  def downvote_release(user_id, release_id) do
    create_or_update_vote(user_id, release_id, -1)
  end

  defp create_or_update_vote(user_id, release_id, vote_value) do
    case Repo.get_by(Vote, user_id: user_id, release_id: release_id) do
      nil ->
        Logger.info("create vote")

        %Vote{}
        |> Vote.changeset(%{user_id: user_id, release_id: release_id, vote: vote_value})
        |> Repo.insert()

      vote ->
        Logger.info("update vote")

        vote
        |> Vote.changeset(%{
          user_id: user_id,
          release_id: release_id,
          vote:
            if vote.vote + vote_value < -1 do
              -1
            else
              if vote.vote + vote_value > 1 do
                1
              else
                vote.vote + vote_value
              end
            end
        })
        |> Repo.update()
    end
  end

  def get_release_score(release_id) do
    from(v in Vote, where: v.release_id == ^release_id, select: sum(v.vote))
    |> Repo.one()
    |> case do
      nil -> 0
      score -> score
    end
  end
end
