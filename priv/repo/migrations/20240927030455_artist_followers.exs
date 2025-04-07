defmodule StayConnect.Repo.Migrations.ArtistFollowers do
  use Ecto.Migration

  def change do
    alter table(:artists) do
      remove :followers
      add :followers, :map
    end
  end
end
