defmodule StayConnect.Repo.Migrations.UpdateReleasesCategoriesTimestamps do
  use Ecto.Migration

  def change do
    rename table(:releases_categories), to: table(:old_releases_categories)

    create table(:releases_categories) do
      add :release_id, references(:releases, on_delete: :delete_all), null: false
      add :category_id, references(:categories, on_delete: :delete_all), null: false
      timestamps(type: :utc_datetime)
    end

    create unique_index(:releases_categories, [:release_id, :category_id])

    execute "INSERT INTO releases_categories (release_id, category_id, inserted_at, updated_at) SELECT release_id, category_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM old_releases_categories"

    drop table(:old_releases_categories)
  end
end
