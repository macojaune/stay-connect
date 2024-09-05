defmodule StayConnect.Repo.Migrations.AddUserIdToArtists do
  use Ecto.Migration

  def change do
    alter table(:artists) do
      add :user_id, references(:users, on_delete: :delete_all)
    end
    
    create index(:artists, [:user_id])
  end
end
