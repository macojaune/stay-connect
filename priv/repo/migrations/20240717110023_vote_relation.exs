defmodule StayConnect.Repo.Migrations.VoteRelation do
  use Ecto.Migration

  def change do
    drop table(:votes)

    create table(:votes) do
      add :vote, :integer
      add :user_id, references("users")
      add :release_id, references("releases")
      timestamps(type: :utc_datetime)
    end
  end
end
