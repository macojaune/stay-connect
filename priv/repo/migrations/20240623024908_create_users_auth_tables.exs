defmodule StayConnect.Repo.Migrations.CreateUsersAuthTables do
  use Ecto.Migration

  def change do
    rename table(:users), to: table(:old__users)

    create table(:users) do
      add :email, :string, null: false, collate: :nocase
      add :hashed_password, :string, null: false
      add :confirmed_at, :utc_datetime
      add :username, :string
      add :isLoxymore, :boolean, default: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:users, [:email, :username])

    create table(:users_tokens) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :token, :binary, null: false, size: 32
      add :context, :string, null: false
      add :sent_to, :string

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:users_tokens, [:user_id])
    create unique_index(:users_tokens, [:context, :token])
    drop table(:old__users)
  end
end
