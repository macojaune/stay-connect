defmodule StayConnect.Repo.Migrations.ReleaseCoverUrl do
  use Ecto.Migration

  def change do
    drop table(:releases)

    create table(:releases) do
      add :description, :string
      add :title, :string
      add :date, :utc_datetime
      add :type, :string
      add :cover, :string
      add :urls, {:array, :string}
      add :artist_id, references("artists")

      timestamps(type: :utc_datetime)
    end
  end
end
