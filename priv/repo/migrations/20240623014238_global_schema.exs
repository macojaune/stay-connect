defmodule StayConnect.Repo.Migrations.GlobalSchema do
  use Ecto.Migration

  def change do
    create table(:artists) do
      add :name, :string
      add :description, :string
      add :socials, {:array, :string}

      timestamps(type: :utc_datetime)
    end

    create table(:categories) do
      add :description, :string
      add :title, :string

      timestamps(type: :utc_datetime)
    end

    create table(:artists_categories) do
      add :artist_id, references("artists")
      add :category_id, references("categories")
      timestamps(type: :utc_datetime)
    end

    create table(:releases) do
      add :description, :string
      add :title, :string
      add :date, :utc_datetime
      add :type, :string
      add :urls, {:array, :string}
      add :artist_id, references("artists")

      timestamps(type: :utc_datetime)
    end

    create table(:features) do
      add :release_id, references("releases")
      add :artist_id, references("artists")
      timestamps(type: :utc_datetime)
    end

    create table(:votes) do
      add :vote, :integer
      add :user_id, references("users")
      add :release_id, references("releases")
      timestamps(type: :utc_datetime)
    end

    unique_index(:users, [:email, :username])
    unique_index(:artists, :name)
    unique_index(:categories, :title)
  end
end
