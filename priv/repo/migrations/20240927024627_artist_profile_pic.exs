defmodule StayConnect.Repo.Migrations.ArtistProfilePic do
  use Ecto.Migration

  def change do
    alter table(:artists) do
      add :profile_picture, :string
      add :followers, {:array, :integer}
    end
  end
end
