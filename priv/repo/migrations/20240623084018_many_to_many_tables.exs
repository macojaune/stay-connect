defmodule StayConnect.Repo.Migrations.ManyToManyTables do
  use Ecto.Migration

  def change do
    create table(:releases_categories) do
      add :release_id, references("releases")
      add :category_id, references("categories")
      timestamps(type: :utc_datetime)
    end
  end
end
